@echo off
echo ============================================
echo APPLY CASE CLOSURE ENHANCEMENT MIGRATION
echo ============================================
echo.

REM Get database credentials from env file
for /f "tokens=1,2 delims==" %%a in (env) do (
    set line=%%a
    set value=%%b
    
    if "!line!"=="database.default.hostname" set DB_HOST=!value!
    if "!line!"=="database.default.database" set DB_NAME=!value!
    if "!line!"=="database.default.username" set DB_USER=!value!
    if "!line!"=="database.default.password" set DB_PASS=!value!
)

REM Remove any spaces and comments
set DB_HOST=%DB_HOST: =%
set DB_NAME=%DB_NAME: =%
set DB_USER=%DB_USER: =%
set DB_PASS=%DB_PASS: =%

echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo User: %DB_USER%
echo.

echo Applying migration...
echo.

mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < app\Database\case_closure_enhancement.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Migration applied successfully!
    echo ============================================
    echo.
    echo New fields added to 'cases' table:
    echo   - closure_type
    echo   - court_acknowledgment_number
    echo   - court_acknowledgment_date
    echo   - court_acknowledgment_deadline
    echo   - court_acknowledgment_document
    echo   - court_acknowledgment_notes
    echo.
    echo The feature is now ready to use!
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Migration failed!
    echo ============================================
    echo Please check:
    echo   1. MySQL is running
    echo   2. Database credentials in 'env' file are correct
    echo   3. You have permission to alter the database
    echo.
)

pause
