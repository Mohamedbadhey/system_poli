@echo off
echo ============================================
echo Non-Criminal Certificate QR Code Migration
echo ============================================
echo.
echo This script will:
echo 1. Create the non_criminal_certificates table
echo 2. Add support for QR code verification
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Applying migration...
echo.

mysql -u root pcms_db < "app/Database/non_criminal_certificates_migration.sql"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Migration applied successfully!
    echo ============================================
    echo.
    echo The following changes have been made:
    echo - Created non_criminal_certificates table
    echo - Added verification_token for QR codes
    echo - Added verification tracking fields
    echo.
    echo Next steps:
    echo 1. Restart your PHP server
    echo 2. Open the non-criminal certificate page
    echo 3. Create and save a certificate
    echo 4. Scan the QR code to verify
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Migration failed!
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database credentials are correct
    echo 3. Database 'pcms_db' exists
    echo.
)

echo.
echo Press any key to exit...
pause > nul
