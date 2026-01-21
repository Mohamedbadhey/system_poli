@echo off
echo ============================================
echo FIX LEGACY CLOSED CASES
echo ============================================
echo.
echo This script will update closed cases that are missing closure data
echo (closed_date, closed_by, closure_type)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Applying fix to database...
php spark db:query --file FIX_LEGACY_CLOSED_CASES.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Legacy closed cases have been fixed.
    echo ============================================
) else (
    echo.
    echo ============================================
    echo ERROR: Failed to apply fix. Check the error messages above.
    echo ============================================
)

echo.
pause
