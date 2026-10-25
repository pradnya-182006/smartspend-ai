@echo off
title SmartSpend AI - Demo Environment Reset
cd /d "%~dp0"

echo ===================================================
echo     Resetting SmartSpend AI Fictional Demo Data
echo ===================================================
echo.
echo This action resets fictional demo records for User 1 (demo_user).
echo Real user accounts and other database records are NOT affected.
echo.

python backend\seed_demo_data.py --reset

echo.
pause
