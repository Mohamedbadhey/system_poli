@echo off
echo ============================================
echo Quick Test - Report Database Saving
echo ============================================
echo.
echo Fix Applied: Model validation corrected
echo.
echo TESTING STEPS:
echo.
echo 1. Open your browser: http://localhost:8080
echo 2. Login as an investigator
echo 3. Open any case (e.g., Case #13 or #34)
echo 4. Click "Basic Report" button
echo 5. Select language and click "View in Browser"
echo 6. Come back here and press any key to check database...
echo.
pause

echo.
echo Checking database for new reports...
echo.

REM Create SQL check
echo SELECT * FROM saved_full_reports ORDER BY created_at DESC LIMIT 3; > temp_test.sql

REM Try to find and run MySQL
if exist "C:\xampp\mysql\bin\mysql.exe" (
    C:\xampp\mysql\bin\mysql.exe -u root pcms_db < temp_test.sql
) else if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe -u root pcms_db < temp_test.sql
) else (
    echo Cannot find MySQL. Please check manually in phpMyAdmin:
    echo.
    echo Run this SQL:
    type temp_test.sql
    echo.
)

del temp_test.sql

echo.
echo ============================================
echo If you see records above, the fix worked!
echo ============================================
echo.
echo Next: Go to Admin Dashboard ^> Daily Operations
echo You should now see the report counts!
echo.
pause
