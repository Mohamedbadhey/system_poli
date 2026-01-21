@echo off
echo ========================================
echo  Applying Reports System Migrations
echo ========================================
echo.

echo Running database migrations...
php spark migrate

echo.
echo ========================================
echo  Migration Complete!
echo ========================================
echo.
echo The following has been set up:
echo  - Enhanced investigation_reports table
echo  - New report_approvals table
echo  - New court_communications table
echo  - Report templates inserted
echo.
echo You can now access the reports dashboard at:
echo http://localhost:8080/reports-dashboard.html
echo.
pause
