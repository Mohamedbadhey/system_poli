@echo off
echo ========================================
echo Applying Court & Custody Tables Migration
echo ========================================
echo.

mysql -u root pcms_db < database/migrations/add_court_custody_tables.sql

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Database tables created successfully!
    echo.
    echo Tables created:
    echo   - court_acknowledgments
    echo   - custody_documentation
    echo.
) else (
    echo.
    echo [ERROR] Failed to create tables.
    echo Please check your MySQL connection.
    echo.
)

pause
