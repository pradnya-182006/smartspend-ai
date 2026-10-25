@echo off
title SmartSpend AI - Frontend Dev Server (Port 5173)
cd /d "%~dp0"

echo ===================================================
echo     Starting SmartSpend AI React / Vite Frontend
echo ===================================================
echo.

:: Check Node.js / NPM installation
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / NPM is not installed or not in PATH!
    echo Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing frontend dependencies...
    call npm install
)

echo Starting Vite development server on http://localhost:5173 ...
call npm run dev
pause
