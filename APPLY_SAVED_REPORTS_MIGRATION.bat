@echo off
echo ========================================
echo   Saved Full Reports - Database Setup
echo ========================================
echo.
echo This will create the saved_full_reports table
echo for storing permanent full case reports with QR codes.
echo.
pause

echo.
echo Running migration...
echo.

mysql -u root -p pcms_db < app/Database/saved_full_reports_migration.sql

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo The saved_full_reports table has been created.
echo.
echo You can now:
echo   1. Generate full reports with permanent URLs
echo   2. QR codes for easy sharing
echo   3. Track report access count
echo.
pause
