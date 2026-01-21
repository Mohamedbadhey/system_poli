@echo off
echo ============================================
echo Applying Case Reopen Migration
echo ============================================
echo.

REM Load database credentials from .env
for /f "tokens=1,2 delims==" %%a in (env) do (
    if "%%a"=="database.default.hostname" set DB_HOST=%%b
    if "%%a"=="database.default.database" set DB_NAME=%%b
    if "%%a"=="database.default.username" set DB_USER=%%b
    if "%%a"=="database.default.password" set DB_PASS=%%b
)

echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo.
echo Applying migration...
echo.

mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < app/Database/case_reopen_migration.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Migration applied successfully!
    echo ============================================
    echo.
    echo New features available:
    echo - Cases can now be reopened after closure
    echo - Full reopen history tracking
    echo - Investigator assignment during reopen
    echo - Reopen reason documentation
    echo.
) else (
    echo.
    echo ============================================
    echo Migration failed!
    echo ============================================
    echo Please check the error messages above.
    echo.
)

pause
