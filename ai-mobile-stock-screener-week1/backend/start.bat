@echo off
echo ============================================
echo AI Stock Screener - Complete Setup and Start
echo ============================================
echo.

cd /d "%~dp0"

REM Step 1: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

REM Step 2: Check/Create .env
echo [2/6] Checking environment configuration...
if not exist .env (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env
    echo [INFO] Please verify DATABASE_URL in .env if needed
)
echo [OK] .env exists
echo.

REM Step 3: Install dependencies
echo [3/6] Installing dependencies...
if not exist node_modules (
    call npm install
    echo.
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Step 4: Create simple DB test
echo [4/6] Testing database connection...
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT 1').then(()=>{console.log('[OK] Database connected');process.exit(0);}).catch(e=>{console.error('[ERROR] Database failed:',e.message);console.error('[FIX] Ensure PostgreSQL is running and DATABASE_URL is correct');process.exit(1)});"

if errorlevel 1 (
    echo.
    echo ============================================
    echo DATABASE CONNECTION FAILED
    echo ============================================
    echo.
    echo Quick fixes:
    echo 1. Start PostgreSQL service
    echo 2. Create database: psql -c "CREATE DATABASE stocks;"
    echo 3. Check DATABASE_URL in .env file
    echo.
    echo Current DATABASE_URL should be like:
    echo postgres://username:password@localhost:5432/stocks
    echo.
    pause
    exit /b 1
)
echo.

REM Step 5: Info message
echo [5/6] Database setup...
echo [INFO] The server will auto-create tables and seed data on first run
echo.

REM Step 6: Start server
echo [6/6] Starting server...
echo.
echo ============================================
echo Server starting...
echo Access at: http://localhost:3000/screener.html
echo Health check: http://localhost:3000/health
echo Press Ctrl+C to stop
echo ============================================
echo.

node index.js
