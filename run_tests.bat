@echo off
title SmartSpend AI - Automated Test Runner
cd /d "%~dp0"

echo ===================================================
echo     Running SmartSpend AI Automated Test Suite
echo ===================================================
echo.

python -m pytest tests -v
if errorlevel 1 (
    echo.
    echo [FAIL] Some tests failed. Please inspect the output above.
) else (
    echo.
    echo [SUCCESS] All automated tests passed successfully!
)
pause
