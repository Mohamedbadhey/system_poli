@echo off
echo ========================================
echo  Applying Report Settings Migration
echo ========================================
echo.

REM Run the migration
php spark migrate

echo.
echo ========================================
echo  Migration Complete!
echo ========================================
echo.
echo The report_settings table has been created with default configurations.
echo You can now access Report Settings from the Admin menu.
echo.
pause
