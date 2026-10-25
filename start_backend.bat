@echo off
title SmartSpend AI - Backend Server (Port 5000)
cd /d "%~dp0"

echo ===================================================
echo     Starting SmartSpend AI Flask Backend API
echo ===================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ and add it to your system PATH.
    pause
    exit /b 1
)

:: Check if port 5000 is already in use
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 5000 is currently occupied by another process.
    echo If this is an existing SmartSpend AI backend, requests will be handled normally.
    echo If this is an unrelated application, please close it or change the port.
    echo.
)

echo Starting Flask server on http://127.0.0.1:5000 ...
python -m backend.app
pause
