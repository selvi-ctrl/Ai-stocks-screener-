/*
 * Demo: Natural language → DSL → SQL → DB results
 * Usage: npm run demo:screener
 */

const { parseToDSL } = require('../services/llmParser');
const { validateDSL } = require('../services/dslValidator');
const { compileDSLToSQL } = require('../services/screenerCompiler');
const { runCompiledQuery } = require('../services/screenerRunner');
const { bootstrapScreenerMetrics } = require('../services/screenerStorage');

async function runDemo(query) {
    console.log('NL Query:', query);
    const dsl = await parseToDSL(query);
    const { valid, errors, normalized } = validateDSL(dsl);
    if (!valid) {
        throw new Error(`DSL validation failed: ${errors.join('; ')}`);
    }

    console.log('DSL:', JSON.stringify(normalized, null, 2));
    const compiled = compileDSLToSQL(normalized);
    console.log('SQL:', compiled.sql);
    console.log('Params:', compiled.params);

    const result = await runCompiledQuery(compiled);
    console.log('Rows:', result.rows);
    console.log('Meta:', { rowCount: result.rowCount, cache: result.fromCache, ms: result.executionMs });
    return result;
}

async function main() {
    const sampleQueries = [
        'Show me all stocks with PE < 25',
        'banks with promoter holding above 50 and earnings positive',
        'IT stocks with pe_ratio <= 30 and market cap > 200000'
    ];

    await bootstrapScreenerMetrics();

    for (const q of sampleQueries) {
        await runDemo(q);
        console.log('---');
    }
}

main().catch((err) => {
    console.error('Demo failed:', err.message);
    process.exit(1);
});
