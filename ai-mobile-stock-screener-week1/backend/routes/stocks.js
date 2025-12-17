const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const db = require('../db');
const router = express.Router();

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/stocks/quote/:symbol
 * Get real-time quote for a specific stock symbol
 */
router.get('/quote/:symbol', asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    if (!symbol) {
        return res.status(400).json({ error: 'Stock symbol is required' });
    }

    try {
        console.log(`Fetching quote for ${symbol}...`);
        const quote = await yahooFinance.quote(symbol);

        res.json({
            success: true,
            data: {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName,
                price: quote.regularMarketPrice,
                previousClose: quote.regularMarketPreviousClose,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock quote',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/quotes
 * Get real-time quotes for multiple stock symbols
 * Query params: symbols (comma-separated)
 */
router.get('/quotes', asyncHandler(async (req, res) => {
    const { symbols } = req.query;

    if (!symbols) {
        return res.status(400).json({ error: 'Symbols parameter is required (comma-separated)' });
    }

    const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

    try {
        console.log(`Fetching quotes for: ${symbolArray.join(', ')}`);
        const quotes = await Promise.all(
            symbolArray.map(async (symbol) => {
                try {
                    const quote = await yahooFinance.quote(symbol);
                    return {
                        symbol: quote.symbol,
                        name: quote.longName || quote.shortName,
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        volume: quote.regularMarketVolume
                    };
                } catch (err) {
                    console.error(`Error fetching ${symbol}:`, err.message);
                    return {
                        symbol,
                        error: 'Failed to fetch',
                        message: err.message
                    };
                }
            })
        );

        res.json({
            success: true,
            data: quotes,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching multiple quotes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock quotes',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/historical/:symbol
 * Get historical data for a stock
 * Query params: period1 (start date), period2 (end date), interval (1d, 1wk, 1mo)
 */
router.get('/historical/:symbol', asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const { period1, period2, interval = '1d' } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Stock symbol is required' });
    }

    try {
        const queryOptions = {
            period1: period1 || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: 30 days ago
            period2: period2 || new Date(), // Default: today
            interval: interval
        };

        console.log(`Fetching historical data for ${symbol}...`);
        const result = await yahooFinance.historical(symbol, queryOptions);

        res.json({
            success: true,
            data: result,
            timestamp: new Date()
        });
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/search/:query
 * Search for stocks by name or symbol
 */
router.get('/search/:query', asyncHandler(async (req, res) => {
    const { query } = req.params;

    if (!query || query.length < 1) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        console.log(`Searching for: ${query}`);
        const results = await yahooFinance.search(query);

        res.json({
            success: true,
            data: results.quotes.slice(0, 10), // Limit to top 10 results
            timestamp: new Date()
        });
    } catch (error) {
        console.error(`Error searching for ${query}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to search stocks',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/db
 * Get stocks from database (from ingestion)
 * Query params: limit, offset
 */
router.get('/db', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const query = `
            SELECT * FROM stocks 
            ORDER BY symbol 
            LIMIT $1 OFFSET $2
        `;
        
        const result = await db.query(query, [limit, offset]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            limit,
            offset,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching stocks from database:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stocks from database',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/db/:symbol
 * Get specific stock from database
 */
router.get('/db/:symbol', asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    try {
        const query = 'SELECT * FROM stocks WHERE symbol = $1';
        const result = await db.query(query, [symbol.toUpperCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found in database'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            timestamp: new Date()
        });
    } catch (error) {
        console.error(`Error fetching stock ${symbol} from database:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock from database',
            message: error.message
        });
    }
}));

/**
 * GET /api/stocks/status
 * Get API status and health check
 */
router.get('/status', asyncHandler(async (req, res) => {
    try {
        // Test database connection
        const dbTest = await db.query('SELECT COUNT(*) FROM stocks');
        const stockCount = parseInt(dbTest.rows[0].count);

        // Test Yahoo Finance API
        let yahooStatus = 'OK';
        try {
            await yahooFinance.quote('AAPL');
        } catch (err) {
            yahooStatus = 'ERROR: ' + err.message;
        }

        res.json({
            success: true,
            status: 'operational',
            database: {
                connected: true,
                stockCount
            },
            yahooFinanceAPI: {
                status: yahooStatus
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error in status check:', error);
        res.status(500).json({
            success: false,
            error: 'Status check failed',
            message: error.message
        });
    }
}));

// Global error handler for this router
router.use((err, req, res, next) => {
    console.error('Stock route error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date()
    });
});

module.exports = router;
