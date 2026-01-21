@echo off
echo ================================================
echo  Adding Language Support to PCMS Database
echo ================================================
echo.

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0

REM Database connection settings
set DB_HOST=localhost
set DB_USER=root
set DB_PASS=
set DB_NAME=pcms_db

echo Applying language column migration...
echo.

REM Apply the SQL migration
mysql -h %DB_HOST% -u %DB_USER% %DB_NAME% < "%SCRIPT_DIR%ADD_LANGUAGE_MIGRATION.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo  Migration applied successfully!
    echo ================================================
    echo.
    echo Language column added to users table.
    echo Default language set to 'en' for all users.
    echo.
) else (
    echo.
    echo ================================================
    echo  Error applying migration!
    echo ================================================
    echo.
    echo Please check your database connection settings.
    echo.
)

pause
