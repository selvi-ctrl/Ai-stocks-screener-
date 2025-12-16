@echo off
echo ================================================
echo AI Stock Screener - Starting Docker Desktop
echo ================================================
echo.
echo Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo.
echo Waiting 30 seconds for Docker to start...
timeout /t 30 /nobreak
echo.
echo Docker should be ready now. Running the application...
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File start.ps1
