const db = require('../db');

const seedRows = [
    ['TCS', 'Tata Consultancy Services', 'IT', 28.5, 72.0, true, 'Q2FY25', 1285000],
    ['INFY', 'Infosys Limited', 'IT', 26.2, 74.0, true, 'Q2FY25', 605000],
    ['WIPRO', 'Wipro Limited', 'IT', 24.8, 73.5, true, 'Q2FY25', 232000],
    ['HCLTECH', 'HCL Technologies', 'IT', 22.5, 60.0, true, 'Q2FY25', 349000],
    ['TECHM', 'Tech Mahindra', 'IT', 29.3, 35.0, false, 'Q2FY25', 113000],
    ['SBIN', 'State Bank of India', 'Financials', 13.1, 57.6, true, 'Q2FY25', 750000],
    ['RELIANCE', 'Reliance Industries', 'Energy', 24.0, 50.5, true, 'Q2FY25', 1800000],
    ['HDFCBANK', 'HDFC Bank', 'Financials', 19.4, 25.0, true, 'Q2FY25', 1100000]
];

async function bootstrapScreenerMetrics() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS screener_metrics (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(12) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            sector VARCHAR(120),
            pe_ratio NUMERIC,
            promoter_holding NUMERIC,
            earnings_positive BOOLEAN,
            quarter VARCHAR(16),
            market_cap NUMERIC,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const countResult = await db.query('SELECT COUNT(*) FROM screener_metrics');
    const currentCount = Number(countResult.rows[0].count || 0);

    if (currentCount === 0) {
        const values = seedRows
            .map((_, idx) => `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`)
            .join(', ');

        const flatValues = seedRows.flat();
        await db.query(
            `INSERT INTO screener_metrics (symbol, name, sector, pe_ratio, promoter_holding, earnings_positive, quarter, market_cap)
             VALUES ${values}
             ON CONFLICT (symbol) DO NOTHING`,
            flatValues
        );
        console.log('Seeded screener_metrics with starter dataset');
    }
}

module.exports = {
    bootstrapScreenerMetrics
};
