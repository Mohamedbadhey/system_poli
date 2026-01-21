@echo off
echo ========================================
echo   Medical Forms Database Check
echo ========================================
echo.
echo This will show all medical examination forms
echo in your database.
echo.
pause

echo.
echo Connecting to database...
echo.

REM Replace with your MySQL credentials if different
set DB_USER=root
set DB_PASS=
set DB_NAME=pcms_db

echo Running queries...
echo.

mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < CHECK_MEDICAL_FORMS.sql

echo.
echo ========================================
echo   Query Complete!
echo ========================================
pause
