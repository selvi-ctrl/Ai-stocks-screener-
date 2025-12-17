const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');
const { verifyToken, verifyAdmin } = authRoutes;
const parseRoutes = require('./routes/parse');
const stocksRoutes = require('./routes/stocks');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parse', parseRoutes);
app.use('/api/stocks', stocksRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Scheduler status endpoint
app.get('/api/scheduler/status', (req, res) => {
    try {
        const status = scheduler.getSchedulerStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Manual trigger endpoint (admin only)
app.post('/api/scheduler/trigger', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await scheduler.triggerManualRun();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test database connection
db.query('SELECT NOW()')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err));

// Initialize scheduler
try {
    scheduler.initScheduler();
    console.log('Stock data scheduler started successfully');
} catch (error) {
    console.error('Failed to start scheduler:', error);
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}/login.html`);
});