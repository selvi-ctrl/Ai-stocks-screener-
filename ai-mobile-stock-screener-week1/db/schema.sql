CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(255),
    industry VARCHAR(255)
);

CREATE TABLE fundamentals (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    symbol VARCHAR(10) UNIQUE,
    fiscal_year INT,
    revenue NUMERIC,
    net_income NUMERIC,
    debt_to_fcf NUMERIC,
    market_cap NUMERIC,
    trailing_pe NUMERIC,
    forward_pe NUMERIC
);

CREATE TABLE quarterly_results (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    quarter DATE NOT NULL,
    revenue NUMERIC,
    net_income NUMERIC
);

CREATE TABLE price_snapshots (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    snapshot_date DATE NOT NULL,
    open_price NUMERIC,
    close_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    volume BIGINT
);

CREATE TABLE portfolios (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE portfolio_positions (
    id SERIAL PRIMARY KEY,
    portfolio_id INT REFERENCES portfolios(id),
    company_id INT REFERENCES companies(id),
    shares INT NOT NULL
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    company_id INT REFERENCES companies(id),
    alert_type VARCHAR(50),
    threshold NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Screener specific metrics to power NL → DSL → SQL flow
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
);

-- Starter dataset to make the screener demo work out of the box
INSERT INTO screener_metrics (symbol, name, sector, pe_ratio, promoter_holding, earnings_positive, quarter, market_cap)
VALUES
    ('TCS', 'Tata Consultancy Services', 'IT', 28.5, 72.0, TRUE, 'Q2FY25', 1285000),
    ('INFY', 'Infosys Limited', 'IT', 26.2, 74.0, TRUE, 'Q2FY25', 605000),
    ('WIPRO', 'Wipro Limited', 'IT', 24.8, 73.5, TRUE, 'Q2FY25', 232000),
    ('HCLTECH', 'HCL Technologies', 'IT', 22.5, 60.0, TRUE, 'Q2FY25', 349000),
    ('TECHM', 'Tech Mahindra', 'IT', 29.3, 35.0, FALSE, 'Q2FY25', 113000),
    ('SBIN', 'State Bank of India', 'Financials', 13.1, 57.6, TRUE, 'Q2FY25', 750000),
    ('RELIANCE', 'Reliance Industries', 'Energy', 24.0, 50.5, TRUE, 'Q2FY25', 1800000),
    ('HDFCBANK', 'HDFC Bank', 'Financials', 19.4, 25.0, TRUE, 'Q2FY25', 1100000)
ON CONFLICT (symbol) DO NOTHING;