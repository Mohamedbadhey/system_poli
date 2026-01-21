@echo off
echo ========================================
echo   Install PDF Library for Reports
echo ========================================
echo.
echo This will install mPDF library for generating
echo PDF reports from HTML.
echo.
pause

echo.
echo Installing mPDF via Composer...
echo.

composer require mpdf/mpdf

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Installation Successful!
    echo ========================================
    echo.
    echo mPDF is now installed and ready to use.
    echo You can now generate PDF reports.
) else (
    echo   ✗ Installation Failed
    echo ========================================
    echo.
    echo Please check:
    echo   1. Composer is installed
    echo   2. Internet connection is active
    echo   3. Run as Administrator
)
echo.
pause
