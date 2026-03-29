const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { tokenCookieOptions } = require('../cookieOptions');
const bcrypt = require('bcryptjs');

function parseFormEncoded(value) {
    const params = new URLSearchParams(value);
    const result = {};

    for (const [key, formValue] of params.entries()) {
        result[key] = formValue;
    }

    return result;
}

function getRequestBody(req) {
    if (
        req.body &&
        typeof req.body === 'object' &&
        !Array.isArray(req.body) &&
        Object.keys(req.body).length > 0
    ) {
        return req.body;
    }

    if (typeof req.body === 'string' && req.body.trim()) {
        try {
            return JSON.parse(req.body);
        } catch (_error) {
            return parseFormEncoded(req.body);
        }
    }

    if (typeof req.rawBody === 'string' && req.rawBody.trim()) {
        try {
            return JSON.parse(req.rawBody);
        } catch (_error) {
            return parseFormEncoded(req.rawBody);
        }
    }

    return {};
}

function getFieldFromRequest(req, fieldName) {
    const body = getRequestBody(req);
    const fromBody = body[fieldName];
    if (fromBody !== undefined && fromBody !== null && fromBody !== '') {
        return String(fromBody);
    }

    const query = req.query || req.netlifyEvent?.queryStringParameters || {};
    if (query[fieldName] !== undefined && query[fieldName] !== null && query[fieldName] !== '') {
        return String(query[fieldName]);
    }

    return '';
}

// Helper to generate unique 6-character alphanumeric code
const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Get all societies (for selection during signup)
router.get('/', async (req, res) => {
    console.log('GET /api/societies - Fetching all societies');
    try {
        const societies = await prisma.society.findMany({
            where: { approvalStatus: 'APPROVED' },
            select: {
                id: true,
                name: true,
                city: true,
                approvalStatus: true,
                subscriptionPlan: true,
                subscriptionStatus: true
            }
        });
        res.json(societies);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new society
router.post('/', authMiddleware, async (req, res) => {
    const name = getFieldFromRequest(req, 'name');
    const city = getFieldFromRequest(req, 'city');
    const wing = getFieldFromRequest(req, 'wing');
    const roomNumber = getFieldFromRequest(req, 'roomNumber');
    let accessCode = getFieldFromRequest(req, 'accessCode');

    if (!name || !city) {
        return res.status(400).json({ error: 'Name and City are required' });
    }
    if (!roomNumber) {
        return res.status(400).json({ error: 'Room Number is required' });
    }

    try {
        // If no access code provided, generate a unique one
        if (!accessCode) {
            let isUnique = false;
            while (!isUnique) {
                accessCode = generateAccessCode();
                const existing = await prisma.society.findUnique({ where: { accessCode } });
                if (!existing) isUnique = true;
            }
        }

        const society = await prisma.society.create({
            data: {
                name,
                city,
                accessCode,
                approvalStatus: 'PENDING',
                subscriptionPlan: 'FREE',
                subscriptionStatus: 'TRIALING',
                subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
        });

        // Make the creator a SOCIETY_ADMIN and associate them
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                societyId: society.id,
                role: 'SOCIETY_ADMIN',
                wing: wing?.trim() || null,
                roomNumber: roomNumber.trim()
            }
        });

        const updatedUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { society: { select: { name: true, city: true } } }
        });

        // Generate new token with society information
        const token = jwt.sign(
            { id: req.user.id, role: 'SOCIETY_ADMIN', societyId: society.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, tokenCookieOptions);

        res.status(201).json({
            society,
            user: updatedUser,
            token
        });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Access code must be unique' });
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Join a society
router.post('/join', authMiddleware, async (req, res) => {
    const accessCode = getFieldFromRequest(req, 'accessCode');
    const societyId = getFieldFromRequest(req, 'societyId');
    const wing = getFieldFromRequest(req, 'wing');
    const roomNumber = getFieldFromRequest(req, 'roomNumber');
    const normalizedCode = accessCode?.trim().toUpperCase();
    const normalizedSocietyId = societyId?.trim();
    if (!normalizedCode && !normalizedSocietyId) {
        return res.status(400).json({ error: 'Select a society or enter an access code' });
    }
    if (!roomNumber) {
        return res.status(400).json({ error: 'Room Number is required' });
    }
    try {
        const society = normalizedSocietyId
            ? await prisma.society.findUnique({ where: { id: normalizedSocietyId } })
            : await prisma.society.findUnique({ where: { accessCode: normalizedCode } });
        if (!society) return res.status(404).json({ error: 'Invalid access code' });

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                societyId: society.id,
                status: 'PENDING',
                wing: wing?.trim() || null,
                roomNumber: roomNumber.trim()
            },
            include: { society: { select: { name: true, city: true } } }
        });

        // Generate new token with society information
        const token = jwt.sign(
            { id: user.id, role: user.role, societyId: user.societyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, tokenCookieOptions);

        res.json({ message: 'Joined successfully', society, user, token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============== ADMIN ROUTES ==============

// Middleware: check if user is SOCIETY_ADMIN
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'SOCIETY_ADMIN' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const platformOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Platform admin access required' });
    }
    next();
};

// GET admin stats for current society
router.get('/admin/stats', authMiddleware, adminOnly, async (req, res) => {
    const { societyId } = req.user;
    try {
        const memberCount = await prisma.user.count({ where: { societyId, status: 'ACTIVE' } });
        const bookCount = await prisma.book.count({ where: { societyId } });
        const requestCount = await prisma.exchangeRequest.count({
            where: { book: { societyId }, status: { in: ['REQUESTED', 'APPROVED'] } }
        });
        const pendingCount = await prisma.user.count({ where: { societyId, status: 'PENDING' } });
        res.json({ memberCount, bookCount, requestCount, pendingCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all members in society (both pending and active)
router.get('/admin/members', authMiddleware, adminOnly, async (req, res) => {
    const { societyId } = req.user;
    try {
        const members = await prisma.user.findMany({
            where: { societyId },
            select: {
                id: true, name: true, phone: true, role: true,
                status: true, createdAt: true,
                _count: { select: { books: true } }
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
        });
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all exchange requests in society
router.get('/admin/requests', authMiddleware, adminOnly, async (req, res) => {
    const { societyId } = req.user;
    try {
        const requests = await prisma.exchangeRequest.findMany({
            where: { book: { societyId } },
            include: {
                book: { select: { id: true, title: true, author: true } },
                requester: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH promote/demote member role
router.patch('/admin/members/:id/role', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const role = getFieldFromRequest(req, 'role');
    const validRoles = ['MEMBER', 'SOCIETY_ADMIN'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, name: true, role: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH approve or reject a pending member
router.patch('/admin/members/:id/approve', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const action = getFieldFromRequest(req, 'action'); // 'approve' or 'reject'
    try {
        if (action === 'approve') {
            const user = await prisma.user.update({
                where: { id },
                data: { status: 'ACTIVE' },
                select: { id: true, name: true, status: true }
            });
            return res.json(user);
        } else if (action === 'reject') {
            // Remove from society
            const user = await prisma.user.update({
                where: { id },
                data: { societyId: null, status: 'ACTIVE' },
                select: { id: true, name: true, status: true }
            });
            return res.json(user);
        }
        res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============== PLATFORM ADMIN ROUTES ==============

router.get('/admin/platform/overview', authMiddleware, platformOnly, async (req, res) => {
    try {
        const totalSocieties = await prisma.society.count();
        const pendingSocieties = await prisma.society.count({ where: { approvalStatus: 'PENDING' } });
        const approvedSocieties = await prisma.society.count({ where: { approvalStatus: 'APPROVED' } });
        const activeSubscriptions = await prisma.society.count({ where: { subscriptionStatus: 'ACTIVE' } });
        const totalUsers = await prisma.user.count();
        const totalBooks = await prisma.book.count();
        const societies = await prisma.society.findMany({
            select: {
                id: true,
                name: true,
                city: true,
                accessCode: true,
                approvalStatus: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                        books: true
                    }
                },
                users: {
                    where: { role: 'SOCIETY_ADMIN' },
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        status: true
                    },
                    take: 1
                }
            },
            orderBy: [
                { approvalStatus: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            stats: {
                totalSocieties,
                pendingSocieties,
                approvedSocieties,
                activeSubscriptions,
                totalUsers,
                totalBooks
            },
            societies
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/admin/platform/societies', authMiddleware, platformOnly, async (req, res) => {
    const name = getFieldFromRequest(req, 'name');
    const city = getFieldFromRequest(req, 'city');
    const accessCode = getFieldFromRequest(req, 'accessCode');
    const approvalStatus = getFieldFromRequest(req, 'approvalStatus');
    const subscriptionPlan = getFieldFromRequest(req, 'subscriptionPlan');
    const subscriptionStatus = getFieldFromRequest(req, 'subscriptionStatus');
    const adminName = getFieldFromRequest(req, 'adminName');
    const adminPhone = getFieldFromRequest(req, 'adminPhone');
    const adminPassword = getFieldFromRequest(req, 'adminPassword');
    let code = accessCode?.trim().toUpperCase();
    const normalizedAdminName = adminName?.trim();
    const normalizedAdminPhone = adminPhone?.trim();

    if (!name || !city) {
        return res.status(400).json({ error: 'Name and City are required' });
    }

    if (!normalizedAdminName || !normalizedAdminPhone || !adminPassword) {
        return res.status(400).json({ error: 'Admin name, phone, and password are required' });
    }

    try {
        if (code) {
            const existingCode = await prisma.society.findUnique({ where: { accessCode: code } });
            if (existingCode) {
                return res.status(400).json({ error: 'Access code must be unique' });
            }
        }

        const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedAdminPhone } });
        if (existingPhone) {
            return res.status(400).json({ error: 'Admin phone already exists' });
        }

        if (!code) {
            let isUnique = false;
            while (!isUnique) {
                code = generateAccessCode();
                const existing = await prisma.society.findUnique({ where: { accessCode: code } });
                if (!existing) isUnique = true;
            }
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const society = await prisma.$transaction(async (tx) => {
            const createdSociety = await tx.society.create({
                data: {
                    name,
                    city,
                    accessCode: code,
                    approvalStatus: approvalStatus || 'APPROVED',
                    subscriptionPlan: subscriptionPlan || 'FREE',
                    subscriptionStatus: subscriptionStatus || 'TRIALING',
                    subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    approvedAt: (approvalStatus || 'APPROVED') === 'APPROVED' ? new Date() : null
                }
            });

            await tx.user.create({
                data: {
                    name: normalizedAdminName,
                    phone: normalizedAdminPhone,
                    password: hashedPassword,
                    role: 'SOCIETY_ADMIN',
                    status: 'ACTIVE',
                    societyId: createdSociety.id
                }
            });

            return tx.society.findUnique({
                where: { id: createdSociety.id },
                select: {
                    id: true,
                    name: true,
                    city: true,
                    accessCode: true,
                    approvalStatus: true,
                    subscriptionPlan: true,
                    subscriptionStatus: true,
                    subscriptionEndsAt: true,
                    createdAt: true
                }
            });
        });

        res.status(201).json(society);
    } catch (error) {
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            if (target.includes('accessCode')) {
                return res.status(400).json({ error: 'Access code must be unique' });
            }
            if (target.includes('phone')) {
                return res.status(400).json({ error: 'Admin phone already exists' });
            }
            return res.status(400).json({ error: 'A unique field already exists' });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/admin/platform/societies/:id/approval', authMiddleware, platformOnly, async (req, res) => {
    const { id } = req.params;
    const approvalStatus = getFieldFromRequest(req, 'approvalStatus');
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

    if (!validStatuses.includes(approvalStatus)) {
        return res.status(400).json({ error: 'Invalid approval status' });
    }

    try {
        const society = await prisma.society.update({
            where: { id },
            data: {
                approvalStatus,
                approvedAt: approvalStatus === 'APPROVED' ? new Date() : null
            },
            select: {
                id: true,
                approvalStatus: true,
                approvedAt: true
            }
        });

        res.json(society);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/admin/platform/societies/:id/subscription', authMiddleware, platformOnly, async (req, res) => {
    const { id } = req.params;
    const subscriptionPlan = getFieldFromRequest(req, 'subscriptionPlan');
    const subscriptionStatus = getFieldFromRequest(req, 'subscriptionStatus');
    const subscriptionEndsAt = getFieldFromRequest(req, 'subscriptionEndsAt');
    const validPlans = ['FREE', 'PRO', 'ENTERPRISE'];
    const validStatuses = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];

    if (!validPlans.includes(subscriptionPlan) || !validStatuses.includes(subscriptionStatus)) {
        return res.status(400).json({ error: 'Invalid subscription values' });
    }

    try {
        const society = await prisma.society.update({
            where: { id },
            data: {
                subscriptionPlan,
                subscriptionStatus,
                subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null
            },
            select: {
                id: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true
            }
        });

        res.json(society);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
