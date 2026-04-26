const jwt = require('jsonwebtoken');
const env = require('../config/env');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    }
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
        req.user = decoded;
        next();
    });
};

module.exports = verifyJWT;
