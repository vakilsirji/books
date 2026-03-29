const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { tokenCookieOptions } = require('../cookieOptions');

const societySelect = {
    name: true,
    city: true,
    approvalStatus: true,
    subscriptionPlan: true,
    subscriptionStatus: true,
    subscriptionEndsAt: true
};

// Check if user exists and has a password
router.post('/check-user', async (req, res) => {
    const { phone } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { phone } });
        res.json({
            exists: !!user,
            hasPassword: !!user?.password,
            name: user?.name || '',
            wing: user?.wing || '',
            roomNumber: user?.roomNumber || ''
        });
    } catch (error) {
        console.error('Check user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login with Password
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { phone },
            include: { society: { select: societySelect } }
        });
        if (!user || !user.password) {
            return res.status(400).json({ error: 'User does not have a password set. Use OTP login.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, societyId: user.societyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, tokenCookieOptions);

        res.json({ message: 'Logged in successfully', user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request OTP (Mock)
router.post('/request-otp', async (req, res) => {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    try {
        let user = await prisma.user.findUnique({
            where: { phone },
            include: { society: { select: societySelect } }
        });
        if (!user) {
            // New user registration will collect name in verify-otp step
        }

        // In a real app, send OTP via SMS. For MVP, we'll return a static OTP 123456
        res.json({ message: 'OTP sent successfully', mockOtp: '123456' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Verify OTP & Complete Signup/Update
router.post('/verify-otp', async (req, res) => {
    const { phone, otp, name, password } = req.body;

    // Hardcoded MVP check
    if (otp !== '123456') {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { phone },
            include: { society: { select: societySelect } }
        });

        if (!user) {
            // New user registration
            if (!name || !password) return res.status(400).json({ error: 'Name and Password are required' });
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: { phone, name, password: hashedPassword },
                include: { society: { select: societySelect } }
            });
        } else if (password && !user.password) {
            // Existing user setting password for the first time
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.update({
                where: { phone },
                data: {
                    password: hashedPassword,
                    ...(name && { name }) // Only update name if provided
                },
                include: { society: { select: societySelect } }
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, societyId: user.societyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, tokenCookieOptions);
        res.json({ message: 'Logged in successfully', user, token });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', tokenCookieOptions);
    res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { society: { select: societySelect } }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
