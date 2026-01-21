@echo off
echo ============================================================================
echo Migration: Convert crime_category from ENUM to Dynamic Categories
echo ============================================================================
echo.
echo This script will:
echo 1. Convert crime_category from ENUM to VARCHAR(100)
echo 2. Allow dynamic categories from the categories table
echo 3. Preserve all existing case data
echo.
echo IMPORTANT: Make sure you have a backup of your database before proceeding!
echo.
pause

echo.
echo Running migration...
echo.

mysql -u root -p pcms_db < MIGRATE_CATEGORY_TO_DYNAMIC.sql

echo.
echo ============================================================================
echo Migration completed!
echo ============================================================================
echo.
echo Next steps:
echo 1. Test the OB Entry and Incident Entry forms
echo 2. Select a category from the dropdown
echo 3. Submit a case and verify it saves correctly
echo 4. Check that custom Somali categories now work
echo.
pause
