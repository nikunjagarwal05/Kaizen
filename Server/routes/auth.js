import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import { generateAccessToken, generateRefreshToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

/*
POST /api/auth/register
Registers a new user with email and password
*/

router.post('/register', [
    body('name').trim().isLength({ min:2, max:50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6}).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    try{
        const errors = validateResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash Password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create User
        const user = new User({
            name, 
            email,
            passwordHash,
        });
        await user.save();

        // Create intial stats
        const stats = new UserStats({ userId: user._id });
        await stats.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // save refresh token
        user.addRefreshToken(refreshToken);
        await user.save();

        res.status(200).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        });
    } catch(error) {
        console.error('Registration error: ', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});


/*
    POST /api/auth/login
    Login with email and password
*/

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async(req, res) => {
    try{
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find User
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(401).json({ error: 'Invalid email' });
        }

        // check password
        if(!user.passwordHash) {
            return res.status(401).json({ error: 'Invalid Password' });
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch) {
            return res.status(401).json({ error: 'wrong Password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // save refresh token
        user.addRefreshToken(refreshToken);
        await user.save();

        res.json({
            message: 'Login Successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        });
    } catch(error) {
        console.error('Login error: ', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});


/*
POST /api/auth/refresh
Refreshe access token using refresh token
*/
router.post('/refresh', async (req, res) => {
    try{
        const { refreshToken } = req.body;

        if(!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if(!user || !user.refreshToken.includes(refreshToken)) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken();

        res.json({
            accessToken,
        });
    } catch(error) {
        if(error.name == 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

/*
POST /api/auth/logout
Logout and invalidate refresh token
*/

router.post('/logout', authenticate, async(req, res) => {
    try{
        const { refreshToken } = req.body;
        const user = req.user;

        if(refreshToken) {
            user.removeRefreshToken(refreshToken);
            await user.save();
        }

        res.json({ message: 'Logout Successful' });
    } catch(error) {
        console.log('Logout error: ', error);
        res.status(500).json({ error: 'Server error during Logout' });
    }
});


/*
GET /api/auth/me
Get current user profile
*/

router.get('/me', authenticate, async(req, res) => {
    try{
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar,
                createdAt : req.user.createdAt,
            },
        });
    } catch(error) {
        console.error('Get user error: ', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;