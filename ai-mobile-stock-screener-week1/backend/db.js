const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://Shivansh:pass@localhost:5432/stocks',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};