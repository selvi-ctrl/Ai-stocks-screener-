@echo off
echo Starting AI Stock Screener Backend Server...
echo.
cd /d "%~dp0backend"
node index.js
pause
