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
const { bootstrapScreenerMetrics } = require('./services/screenerStorage');

const app = express();
const PORT = process.env.PORT || 3000;

const buildSettings = () => ({
    liveRefreshMs: Number(process.env.LIVE_REFRESH_MS || 5000),
    cacheTtlMs: 10 * 60 * 1000,
    defaultSymbols: (process.env.BINANCE_SYMBOLS || 'BTCUSDT,ETHUSDT,BNBUSDT')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    theme: process.env.DEFAULT_THEME || 'aurora',
    enableIngestion: process.env.ENABLE_INGESTION !== 'false',
});

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

// App settings for frontend
app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: buildSettings() });
});

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

// Initialize server asynchronously
(async () => {
    try {
        // Test database connection
        await db.query('SELECT NOW()');
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection error:', err.message);
        console.error('Please ensure PostgreSQL is running and DATABASE_URL is correct');
        process.exit(1);
    }

    // Bootstrap screener table and seed data
    try {
        await bootstrapScreenerMetrics();
        console.log('Screener metrics table ready');
    } catch (error) {
        console.error('Failed to bootstrap screener metrics:', error.message);
        console.error('Server will start but screener may not work properly');
    }

    // Initialize scheduler
    try {
        scheduler.initScheduler();
        console.log('Stock data scheduler started successfully');
    } catch (error) {
        console.error('Failed to start scheduler:', error.message);
    }

    // Start server after all initialization
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n========================================`);
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Screener UI: http://localhost:${PORT}/screener.html`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`========================================\n`);
        console.log(`Server PID: ${process.pid}`);
        console.log(`Press Ctrl+C to stop\n`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('\nShutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
})().catch(err => {
    console.error('Fatal server error:', err);
    process.exit(1);
});