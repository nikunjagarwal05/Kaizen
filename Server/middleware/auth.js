import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/*
Middleware to verify jwt access token
*/

export const authenticate = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');

        if(!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch(error) {
        if(error.name == 'TokenExpierdError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/*
Generate access token (short lived)
*/

export const generateAccessToken = (userId) => {
    return jwt.sign(
        {userId},
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
};

/*
Generate refresh token (long-lived)
*/

export default generateRefreshToken = (userId) => {
    return jwt.sign(
        {userId},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

