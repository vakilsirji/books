const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Add a book
router.post('/', async (req, res) => {
    const { title, author, category, condition, imageUrl } = req.body;
    if (!req.user.societyId) return res.status(400).json({ error: 'Must belong to a society' });

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
                owner: { select: { id: true, name: true } }
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
                owner: { select: { id: true, name: true } }
            }
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
