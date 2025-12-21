# Database Setup Script
Write-Host "=== Database Setup ===" -ForegroundColor Cyan

$dbUrl = "postgres://Shivansh:pass@localhost:5432/postgres"
$dbName = "stocks"

Write-Host "Checking if database exists..." -ForegroundColor Yellow

# Check if database exists
$checkDb = psql "$dbUrl" -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1

if ($checkDb -match "1") {
    Write-Host "[OK] Database '$dbName' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow
    psql "$dbUrl" -c "CREATE DATABASE $dbName;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database. Please create manually:" -ForegroundColor Red
        Write-Host "  psql -U Shivansh -c 'CREATE DATABASE stocks;'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`nApplying database schema..." -ForegroundColor Yellow
$schemaPath = "../db/schema.sql"
psql "postgres://Shivansh:pass@localhost:5432/$dbName" -f $schemaPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema applied successfully" -ForegroundColor Green
    Write-Host "`n=== Database ready! ===" -ForegroundColor Cyan
    Write-Host "You can now run: .\quick-start.ps1" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Schema application failed" -ForegroundColor Red
    Write-Host "Please check the error above" -ForegroundColor Yellow
}
