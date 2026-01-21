@echo off
echo ============================================
echo FIX CASE STATUS HISTORY TABLE
echo ============================================
echo.

REM Get database credentials from env file
setlocal enabledelayedexpansion
for /f "tokens=1,2 delims==" %%a in (env) do (
    set line=%%a
    set value=%%b
    
    if "!line!"=="database.default.hostname" set DB_HOST=!value!
    if "!line!"=="database.default.database" set DB_NAME=!value!
    if "!line!"=="database.default.username" set DB_USER=!value!
    if "!line!"=="database.default.password" set DB_PASS=!value!
)

REM Remove any spaces
set DB_HOST=%DB_HOST: =%
set DB_NAME=%DB_NAME: =%
set DB_USER=%DB_USER: =%
set DB_PASS=%DB_PASS: =%

echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo.

echo Fixing case_status_history table...
echo Adding old_court_status and new_court_status columns...
echo.

mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < FIX_CASE_STATUS_HISTORY_TABLE.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Table fixed successfully!
    echo ============================================
    echo.
    echo Added columns:
    echo   - old_court_status
    echo   - new_court_status
    echo.
    echo Now you can close cases!
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Failed to fix table!
    echo ============================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Database credentials are correct
    echo   3. You have ALTER table permissions
    echo.
)

pause
