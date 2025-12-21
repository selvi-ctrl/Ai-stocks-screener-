# Quick Setup and Start Script
# Run this script from the project root directory

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AI Stock Screener - Setup & Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start PostgreSQL with Docker Compose
Write-Host ""
Write-Host "[2/5] Starting PostgreSQL database..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✓ Database container started" -ForegroundColor Green
Write-Host "Waiting 15 seconds for database to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Apply database schema
Write-Host ""
Write-Host "[3/5] Applying database schema..." -ForegroundColor Yellow
$containerName = (docker ps --filter "ancestor=postgres:latest" --format "{{.Names}}")
if ($containerName) {
    Get-Content "db\schema.sql" | docker exec -i $containerName psql -U Shivansh -d stocks
    Write-Host "✓ Database schema applied" -ForegroundColor Green
} else {
    Write-Host "✗ Could not find database container" -ForegroundColor Red
    Write-Host "Please run manually: docker exec -i CONTAINER_NAME psql -U Shivansh -d stocks < db/schema.sql" -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host ""
Write-Host "[4/5] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "Dependencies already installed, skipping..." -ForegroundColor Yellow
} else {
    npm install
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
}

# Start the backend server
Write-Host ""
Write-Host "[5/5] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Application is starting..." -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000/login.html" -ForegroundColor Green
Write-Host "Backend API: http://localhost:3000/api" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
