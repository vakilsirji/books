const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

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

// Request a book
router.post('/', async (req, res) => {
    const bookId = getFieldFromRequest(req, 'bookId');
    if (!bookId) {
        return res.status(400).json({ error: 'Book ID is required' });
    }
    try {
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book || book.status !== 'AVAILABLE') {
            return res.status(400).json({ error: 'Book not available' });
        }
        if (book.ownerId === req.user.id) {
            return res.status(400).json({ error: 'Cannot request your own book' });
        }

        const request = await prisma.exchangeRequest.create({
            data: {
                bookId,
                requesterId: req.user.id,
                status: 'REQUESTED'
            }
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's requests (both incoming and outgoing)
router.get('/', async (req, res) => {
    try {
        const incoming = await prisma.exchangeRequest.findMany({
            where: {
                book: { ownerId: req.user.id }
            },
            include: {
                book: true,
                requester: { select: { id: true, name: true, phone: true, wing: true, roomNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const outgoing = await prisma.exchangeRequest.findMany({
            where: { requesterId: req.user.id },
            include: {
                book: { include: { owner: { select: { id: true, name: true, phone: true, wing: true, roomNumber: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ incoming, outgoing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update request status (Approve, Reject, Picked, Returned)
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const request = await prisma.exchangeRequest.findUnique({
            where: { id },
            include: { book: true }
        });

        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Permissions check
        const isOwner = request.book.ownerId === req.user.id;
        const isRequester = request.requesterId === req.user.id;

        if (!isOwner && !isRequester) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Owner can approve/reject/returned
        if (['APPROVED', 'REJECTED', 'RETURNED'].includes(status) && !isOwner) {
            return res.status(403).json({ error: 'Only owner can perform this action' });
        }

        // Requester can mark picked
        if (status === 'PICKED' && !isRequester) {
            return res.status(403).json({ error: 'Only requester can mark as picked' });
        }

        const updatedRequest = await prisma.exchangeRequest.update({
            where: { id },
            data: { status }
        });

        // Update book status accordingly
        if (status === 'APPROVED' || status === 'PICKED') {
            await prisma.book.update({
                where: { id: request.bookId },
                data: { status: 'LENT' }
            });
        } else if (status === 'RETURNED' || status === 'REJECTED') {
            await prisma.book.update({
                where: { id: request.bookId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
