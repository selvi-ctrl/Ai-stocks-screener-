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
    fiscal_year INT NOT NULL,
    revenue NUMERIC,
    net_income NUMERIC,
    debt_to_fcf NUMERIC
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