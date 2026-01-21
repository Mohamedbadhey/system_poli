@echo off
echo ========================================
echo Categories Management Setup
echo ========================================
echo.

echo Running PHP setup script...
echo.

php setup_categories.php

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Setup completed successfully!
) else (
    echo.
    echo Setup failed. Please check the error messages above.
)

echo.
pause
