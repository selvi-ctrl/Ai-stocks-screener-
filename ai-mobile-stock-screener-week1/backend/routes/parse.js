const express = require('express');
const router = express.Router();

const { parseToDSL } = require('../services/llmParser');
const { validateDSL } = require('../services/dslValidator');
const { compileDSLToSQL } = require('../services/screenerCompiler');
const { runCompiledQuery } = require('../services/screenerRunner');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// End-to-end: NL query -> DSL -> SQL -> DB results
router.post('/', asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const dsl = await parseToDSL(query);
    const { valid, errors, normalized } = validateDSL(dsl);

    if (!valid) {
        return res.status(400).json({ success: false, error: 'DSL validation failed', details: errors });
    }

    const compiled = compileDSLToSQL(normalized);
    const result = await runCompiledQuery(compiled);

    res.json({
        success: true,
        data: result.rows,
        meta: {
            rowCount: result.rowCount,
            cache: result.fromCache,
            executionMs: result.executionMs,
            logic: compiled.logic,
            limit: compiled.limit
        },
        dsl: normalized,
        sql: compiled.sql
    });
}));

// Only parse + validate DSL (no database execution)
router.post('/dsl', asyncHandler(async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const dsl = await parseToDSL(query);
    const { valid, errors, normalized } = validateDSL(dsl);

    if (!valid) {
        return res.status(400).json({ success: false, error: 'DSL validation failed', details: errors });
    }

    res.json({ success: true, dsl: normalized });
}));

router.use((err, req, res, next) => {
    console.error('Parser route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Unexpected error' });
});

module.exports = router;