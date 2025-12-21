const { DEFAULT_LOGIC, DEFAULT_LIMIT } = require('./dslValidator');

const COLUMN_MAP = {
    pe_ratio: 'pe_ratio',
    promoter_holding: 'promoter_holding',
    earnings: 'earnings_positive',
    quarter: 'quarter',
    market_cap: 'market_cap',
    sector: 'sector'
};

const NUMERIC_FIELDS = ['pe_ratio', 'promoter_holding', 'market_cap'];

function normalizeLimit(limit) {
    const parsed = Number(limit || DEFAULT_LIMIT);
    if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
    return Math.min(Math.max(parsed, 1), 100);
}

function compileCondition(condition, paramIndex) {
    const column = COLUMN_MAP[condition.field];
    if (!column) return { clause: null, paramCount: 0, values: [] };

    const operator = condition.operator === '==' ? '=' : condition.operator;

    if (NUMERIC_FIELDS.includes(condition.field)) {
        return {
            clause: `${column} ${operator} $${paramIndex}`,
            paramCount: 1,
            values: [condition.value]
        };
    }

    if (condition.field === 'earnings') {
        const value = String(condition.value).toLowerCase() === 'positive';
        return {
            clause: `${column} ${operator === '!=' ? '!=' : '='} $${paramIndex}`,
            paramCount: 1,
            values: [value]
        };
    }

    // Text fields
    return {
        clause: `${column} ${operator === '!=' ? '!=' : '='} $${paramIndex}`,
        paramCount: 1,
        values: [condition.value]
    };
}

function compileDSLToSQL(dsl) {
    const logic = (dsl.logic || DEFAULT_LOGIC).toUpperCase() === 'OR' ? 'OR' : 'AND';
    const limit = normalizeLimit(dsl.limit);

    const whereParts = [];
    const params = [];
    let currentIndex = 1;

    (dsl.conditions || []).forEach((condition) => {
        const compiled = compileCondition(condition, currentIndex);
        if (compiled.clause) {
            whereParts.push(compiled.clause);
            params.push(...compiled.values);
            currentIndex += compiled.paramCount;
        }
    });

    if (whereParts.length === 0) {
        whereParts.push('TRUE');
    }

    const sql = `
        SELECT symbol, name, sector, pe_ratio, promoter_holding, earnings_positive AS earnings, quarter, market_cap
        FROM screener_metrics
        WHERE ${whereParts.join(` ${logic} `)}
        ORDER BY pe_ratio NULLS LAST
        LIMIT $${currentIndex}
    `;

    params.push(limit);

    return {
        sql: sql.trim(),
        params,
        limit,
        logic
    };
}

module.exports = {
    compileDSLToSQL
};
