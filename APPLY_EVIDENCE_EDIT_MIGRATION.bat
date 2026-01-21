@echo off
echo ============================================
echo Evidence Edit Feature - Database Migration
echo ============================================
echo.

REM Check if MySQL is accessible
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MySQL command not found in PATH
    echo Please install MySQL or add it to your PATH environment variable
    pause
    exit /b 1
)

echo Applying database migration for evidence edit tracking...
echo.

REM Apply the migration
mysql -u root police_case_management < app/Database/evidence_edit_history_migration.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Migration applied successfully
    echo ============================================
    echo.
    echo The following changes have been made:
    echo   1. Created 'evidence_edit_history' table
    echo   2. Added edit tracking columns to 'evidence' table
    echo      - is_edited
    echo      - last_edited_at
    echo      - last_edited_by
    echo.
    echo You can now use the evidence editing feature!
) else (
    echo.
    echo ============================================
    echo ERROR: Migration failed
    echo ============================================
    echo.
    echo Possible reasons:
    echo   1. Database 'police_case_management' doesn't exist
    echo   2. Tables might already exist (already migrated)
    echo   3. Insufficient permissions
    echo.
    echo Please check the error message above.
)

echo.
pause
