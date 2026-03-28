const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const bearerToken = req.headers.authorization?.split(' ')[1];
    const cookieToken = req.cookies.token;
    const token = bearerToken || cookieToken;

    console.log('--- Auth Check ---');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Token found in Cookies:', !!cookieToken);
    console.log('Token found in Auth Header:', !!bearerToken);

    if (!token) {
        console.error('No token provided');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, societyId }
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
