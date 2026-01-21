@echo off
echo ============================================
echo Checking saved_full_reports Table Status
echo ============================================
echo.

REM Get database credentials from .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /i "database"') do (
    if /i "%%a"=="database.default.hostname" set DB_HOST=%%b
    if /i "%%a"=="database.default.database" set DB_NAME=%%b
    if /i "%%a"=="database.default.username" set DB_USER=%%b
    if /i "%%a"=="database.default.password" set DB_PASS=%%b
)

echo Database: %DB_NAME%
echo.

REM Create temporary SQL script
echo SHOW TABLES LIKE 'saved_full_reports'; > temp_check.sql
echo SELECT COUNT(*) as 'Total Records' FROM saved_full_reports; >> temp_check.sql
echo DESCRIBE saved_full_reports; >> temp_check.sql

echo Running database check...
echo.

REM Try to find MySQL in common locations
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else (
    echo ERROR: MySQL not found in common locations.
    echo Please run the SQL commands manually in phpMyAdmin.
    echo.
    echo SQL Commands:
    type temp_check.sql
    pause
    del temp_check.sql
    exit /b
)

REM Execute the check
%MYSQL_PATH% -u %DB_USER% -p%DB_PASS% %DB_NAME% < temp_check.sql

echo.
echo ============================================
echo Check complete!
echo ============================================

del temp_check.sql
pause
