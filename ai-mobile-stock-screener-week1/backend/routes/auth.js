const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(403);
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const result = await db.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
            [email, hashedPassword, name, 'user']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'User registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (user && await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '7d' }
            );
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    name: user.name, 
                    role: user.role 
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/create-admin (protected route - requires existing admin or initial setup)
router.post('/create-admin', async (req, res) => {
    const { email, password, name, adminKey } = req.body;
    
    // Check if this is initial setup (no admins exist) or valid admin key
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'admin-setup-2025';
    
    try {
        // Check if any admin exists
        const adminCheck = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
        const adminCount = parseInt(adminCheck.rows[0].count);
        
        // Allow creation if no admins exist OR valid admin key provided
        if (adminCount > 0 && adminKey !== ADMIN_SETUP_KEY) {
            return res.status(403).json({ error: 'Invalid admin setup key' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
            [email, hashedPassword, name, 'admin']
        );
        
        res.status(201).json({ 
            message: 'Admin user created successfully', 
            user: result.rows[0] 
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ error: 'Admin user creation failed' });
    }
});

// GET /api/auth/profile (protected route)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;