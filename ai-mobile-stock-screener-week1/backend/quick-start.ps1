# Quick Start Script - Run from backend folder
Write-Host "=== AI Stock Screener - Quick Start ===" -ForegroundColor Cyan

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please edit .env with your database credentials and run again." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Test database connection
Write-Host "`nTesting database connection..." -ForegroundColor Yellow
$env:NODE_PATH = "./node_modules"
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
    .then(() => { console.log('[OK] Database connected successfully'); process.exit(0); })
    .catch(err => { console.error('[ERROR] Database connection failed:', err.message); process.exit(1); });
" 

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDatabase connection failed! Please check:" -ForegroundColor Red
    Write-Host "1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "2. DATABASE_URL in .env is correct" -ForegroundColor Yellow
    Write-Host "3. Database 'stocks' exists (create with: createdb stocks)" -ForegroundColor Yellow
    exit 1
}

# Start the server
Write-Host "`nStarting backend server..." -ForegroundColor Green
Write-Host "Access the app at: http://localhost:3000/screener.html" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

npm run dev
