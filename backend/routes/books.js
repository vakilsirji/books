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

// Add a book
router.post('/', async (req, res) => {
    const title = getFieldFromRequest(req, 'title');
    const author = getFieldFromRequest(req, 'author');
    const category = getFieldFromRequest(req, 'category');
    const condition = getFieldFromRequest(req, 'condition');
    const imageUrl = getFieldFromRequest(req, 'imageUrl');
    if (!req.user.societyId) return res.status(400).json({ error: 'Must belong to a society' });
    if (!title || !author || !category || !condition) {
        return res.status(400).json({ error: 'Title, author, category, and condition are required' });
    }

    try {
        const book = await prisma.book.create({
            data: {
                title,
                author,
                category,
                condition,
                imageUrl,
                ownerId: req.user.id,
                societyId: req.user.societyId
            }
        });
        res.status(201).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get books in user's society (optionally search/filter)
router.get('/', async (req, res) => {
    const { category, search } = req.query;
    if (!req.user.societyId) return res.status(400).json({ error: 'Must join a society first' });

    const where = {
        societyId: req.user.societyId,
        status: 'AVAILABLE'
    };

    if (category) where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } }
        ];
    }

    try {
        const books = await prisma.book.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true, phone: true, wing: true, roomNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a specific book
router.get('/:id', async (req, res) => {
    try {
        const book = await prisma.book.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { select: { id: true, name: true, phone: true, wing: true, roomNumber: true } }
            }
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
