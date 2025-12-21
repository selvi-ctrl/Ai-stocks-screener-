const NodeCache = require('node-cache');
const db = require('../db');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

async function runCompiledQuery(compiled) {
    const cacheKey = JSON.stringify({ sql: compiled.sql, params: compiled.params });
    const cached = cache.get(cacheKey);

    if (cached) {
        return { ...cached, fromCache: true, executionMs: 0 };
    }

    const start = Date.now();
    const result = await db.query(compiled.sql, compiled.params);
    const payload = {
        rows: result.rows,
        rowCount: result.rowCount,
        fromCache: false,
        executionMs: Date.now() - start
    };

    cache.set(cacheKey, payload);
    return payload;
}

module.exports = {
    runCompiledQuery
};
