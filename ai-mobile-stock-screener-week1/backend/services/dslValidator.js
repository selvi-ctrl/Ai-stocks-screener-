const Ajv = require('ajv');

const ALLOWED_FIELDS = ['pe_ratio', 'promoter_holding', 'earnings', 'quarter', 'market_cap', 'sector'];
const ALLOWED_OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'is'];
const DEFAULT_LOGIC = 'AND';
const DEFAULT_LIMIT = 50;

const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['query', 'conditions'],
    properties: {
        version: { type: 'string' },
        query: { type: 'string', minLength: 1 },
        logic: { type: 'string', enum: ['AND', 'OR'] },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        conditions: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['field', 'operator', 'value'],
                properties: {
                    field: { type: 'string', enum: ALLOWED_FIELDS },
                    operator: { type: 'string', enum: ALLOWED_OPERATORS },
                    value: {}
                }
            }
        }
    }
};

const ajv = new Ajv({ allErrors: true, useDefaults: true });
const validate = ajv.compile(schema);

const fieldTypeGuards = {
    pe_ratio: 'number',
    promoter_holding: 'number',
    earnings: 'string',
    quarter: 'string',
    market_cap: 'number',
    sector: 'string'
};

function validateFieldValue(condition) {
    const expectedType = fieldTypeGuards[condition.field];
    if (!expectedType) {
        return 'Unsupported field';
    }

    if (expectedType === 'number' && typeof condition.value !== 'number') {
        return 'Value must be a number';
    }

    if (expectedType === 'string' && typeof condition.value !== 'string') {
        return 'Value must be a string';
    }

    if (condition.field === 'earnings' && !['positive', 'negative'].includes(String(condition.value).toLowerCase())) {
        return 'Earnings value must be "positive" or "negative"';
    }

    return null;
}

function validateDSL(dsl) {
    const normalized = {
        ...dsl,
        logic: dsl.logic || DEFAULT_LOGIC,
        limit: dsl.limit || DEFAULT_LIMIT,
        version: dsl.version || '1.0'
    };

    const isValid = validate(normalized);
    const errors = [];

    if (!isValid && validate.errors) {
        errors.push(...validate.errors.map(err => `${err.instancePath || 'root'} ${err.message}`));
    }

    if (normalized.conditions && Array.isArray(normalized.conditions)) {
        normalized.conditions.forEach((condition, idx) => {
            const fieldError = validateFieldValue(condition);
            if (fieldError) {
                errors.push(`conditions[${idx}]: ${fieldError}`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        normalized
    };
}

module.exports = {
    validateDSL,
    ALLOWED_FIELDS,
    ALLOWED_OPERATORS,
    DEFAULT_LOGIC,
    DEFAULT_LIMIT
};
