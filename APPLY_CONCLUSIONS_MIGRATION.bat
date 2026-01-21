@echo off
echo ================================================
echo Applying Investigator Conclusions Migration
echo ================================================
echo.

REM Get MySQL path from environment or use default
set MYSQL_PATH=mysql
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Trying common MySQL installation paths...
    if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
    if exist "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe" set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)

echo Using MySQL at: %MYSQL_PATH%
echo.
echo Applying migration to pcms_db database...
echo.

%MYSQL_PATH% -u root pcms_db < database\migrations\add_investigator_conclusions.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Migration Applied Successfully!
    echo ================================================
    echo.
    echo The following table has been created:
    echo - investigator_conclusions
    echo.
) else (
    echo.
    echo ================================================
    echo Migration Failed!
    echo ================================================
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'pcms_db' exists
    echo 3. MySQL credentials are correct
    echo.
)

pause
