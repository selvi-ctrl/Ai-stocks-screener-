const express = require('express');
const https = require('https');
const db = require('../db');
const router = express.Router();

const BINANCE_API_BASE = 'https://api.binance.com';
const buildUrl = (path, params = {}) => {
    const url = new URL(path, BINANCE_API_BASE);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    return url;
};

const fetchJson = (path, params = {}) => new Promise((resolve, reject) => {
    const url = buildUrl(path, params);
    const req = https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(new Error(`Failed to parse Binance response: ${err.message}`));
                }
            } else {
                reject(new Error(`Binance API error ${res.statusCode}: ${body}`));
            }
        });
    });

    req.on('error', (err) => reject(err));
});

// Cache exchange info to avoid hitting Binance on every request
let exchangeInfoCache = { data: null, expiresAt: 0 };
const getExchangeInfo = async () => {
    const now = Date.now();
    if (exchangeInfoCache.data && exchangeInfoCache.expiresAt > now) {
        return exchangeInfoCache.data;
    }

    const data = await fetchJson('/api/v3/exchangeInfo');
    exchangeInfoCache = {
        data,
        expiresAt: now + 10 * 60 * 1000, // 10 minute cache
    };
    return data;
};

const getSymbolLabel = async (symbol) => {
    try {
        const info = await getExchangeInfo();
        const match = info?.symbols?.find((s) => s.symbol === symbol.toUpperCase());
        if (!match) return symbol.toUpperCase();
        return `${match.baseAsset}/${match.quoteAsset}`;
    } catch (err) {
        console.error('Failed to resolve symbol label:', err.message);
        return symbol.toUpperCase();
    }
};

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
        const ticker = await fetchJson('/api/v3/ticker/24hr', { symbol: symbol.toUpperCase() });
        const name = await getSymbolLabel(symbol);

        res.json({
            success: true,
            data: {
                symbol: ticker.symbol,
                name,
                price: Number(ticker.lastPrice),
                previousClose: Number(ticker.prevClosePrice),
                change: Number(ticker.priceChange),
                changePercent: Number(ticker.priceChangePercent),
                dayHigh: Number(ticker.highPrice),
                dayLow: Number(ticker.lowPrice),
                volume: Number(ticker.volume),
                marketCap: null,
                fiftyTwoWeekHigh: null,
                fiftyTwoWeekLow: null,
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
                    const ticker = await fetchJson('/api/v3/ticker/24hr', { symbol });
                    const name = await getSymbolLabel(symbol);
                    return {
                        symbol: ticker.symbol,
                        name,
                        price: Number(ticker.lastPrice),
                        change: Number(ticker.priceChange),
                        changePercent: Number(ticker.priceChangePercent),
                        volume: Number(ticker.volume)
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
        const intervalMap = {
            '1d': '1d',
            '1wk': '1w',
            '1mo': '1M'
        };

        const binanceInterval = intervalMap[interval] || '1d';
        const startTime = period1 ? new Date(period1).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
        const endTime = period2 ? new Date(period2).getTime() : Date.now();

        console.log(`Fetching historical data for ${symbol}...`);
        const result = await fetchJson('/api/v3/klines', {
            symbol: symbol.toUpperCase(),
            interval: binanceInterval,
            startTime,
            endTime
        });

        const transformed = result.map((row) => ({
            date: new Date(row[0]),
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5]),
            closeTime: new Date(row[6])
        }));

        res.json({
            success: true,
            data: transformed,
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
        const info = await getExchangeInfo();
        const q = query.toUpperCase();
        const filtered = (info?.symbols || []).filter((s) =>
            s.symbol.includes(q) ||
            s.baseAsset.includes(q) ||
            s.quoteAsset.includes(q)
        ).slice(0, 10);

        res.json({
            success: true,
            data: filtered.map((s) => ({
                symbol: s.symbol,
                name: `${s.baseAsset}/${s.quoteAsset}`,
                status: s.status
            })),
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

        // Test Binance API
        let binanceStatus = 'OK';
        try {
            await fetchJson('/api/v3/ping');
        } catch (err) {
            binanceStatus = 'ERROR: ' + err.message;
        }

        res.json({
            success: true,
            status: 'operational',
            database: {
                connected: true,
                stockCount
            },
            binanceAPI: {
                status: binanceStatus
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
