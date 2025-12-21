const OpenAI = require('openai');
const { ALLOWED_FIELDS, ALLOWED_OPERATORS, DEFAULT_LOGIC, DEFAULT_LIMIT } = require('./dslValidator');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const baseDSL = (query) => ({
    version: '1.0',
    query,
    logic: DEFAULT_LOGIC,
    limit: DEFAULT_LIMIT,
    conditions: []
});

function numberFromText(text) {
    const match = text.match(/(-?\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
}

function fallbackParser(query) {
    const dsl = baseDSL(query);
    const lowered = query.toLowerCase();

    if (lowered.includes('pe')) {
        const val = numberFromText(lowered);
        if (val !== null) {
            dsl.conditions.push({ field: 'pe_ratio', operator: lowered.includes('>') ? '>' : '<', value: val });
        }
    }

    if (lowered.includes('promoter')) {
        const val = numberFromText(lowered);
        if (val !== null) {
            dsl.conditions.push({ field: 'promoter_holding', operator: lowered.includes('>') ? '>' : '<', value: val });
        }
    }

    if (lowered.includes('earnings')) {
        const sentiment = lowered.includes('negative') ? 'negative' : 'positive';
        dsl.conditions.push({ field: 'earnings', operator: 'is', value: sentiment });
    }

    if (dsl.conditions.length === 0) {
        dsl.conditions.push({ field: 'pe_ratio', operator: '<', value: 100 });
    }

    return dsl;
}

async function llmParser(query) {
    if (!client) {
        return fallbackParser(query);
    }

    const systemPrompt = [
        'You convert natural-language stock screener requests into a strict JSON DSL.',
        `Allowed fields: ${ALLOWED_FIELDS.join(', ')}.`,
        'Allowed operators: >, <, >=, <=, ==, !=, is.',
        'Earnings value must be "positive" or "negative".',
        'Use logic AND/OR at the top level. Default logic is AND.',
        'Only output JSON. Never return explanations or SQL.',
        'JSON shape: {"version":"1.0","query":"original text","logic":"AND","limit":50,"conditions":[{"field":"pe_ratio","operator":"<","value":5}]}',
        'If limit not provided, use 50. If no explicit filters are present, set a broad default like pe_ratio < 100.'
    ].join(' ');

    const response = await client.chat.completions.create({
        model: openaiModel,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ],
        max_tokens: 400
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('LLM returned empty response');
    }

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (err) {
        throw new Error('LLM response was not valid JSON');
    }

    return {
        version: parsed.version || '1.0',
        query,
        logic: parsed.logic || DEFAULT_LOGIC,
        limit: parsed.limit || DEFAULT_LIMIT,
        conditions: Array.isArray(parsed.conditions) ? parsed.conditions : []
    };
}

async function parseToDSL(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Query must be a non-empty string');
    }

    try {
        return await llmParser(query.trim());
    } catch (err) {
        // Fallback to deterministic parser to avoid hard failure
        return fallbackParser(query.trim());
    }
}

module.exports = {
    parseToDSL
};
