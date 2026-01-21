@echo off
echo ============================================
echo Fixing saved_full_reports Table
echo Adding missing updated_at column
echo ============================================
echo.

REM Try to find MySQL
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else (
    echo ERROR: MySQL not found!
    echo.
    echo Please run this SQL manually in phpMyAdmin:
    echo.
    type FIX_SAVED_REPORTS_TABLE.sql
    echo.
    pause
    exit /b
)

echo Applying fix to database...
echo.

%MYSQL_PATH% -u root pcms_db < FIX_SAVED_REPORTS_TABLE.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Table structure fixed.
    echo ============================================
    echo.
    echo Now try generating a report again.
    echo.
) else (
    echo.
    echo ERROR: Failed to apply fix.
    echo Please run the SQL manually in phpMyAdmin.
    echo.
)

pause
