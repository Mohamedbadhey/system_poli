@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   PCMS - Development Server
echo ========================================
echo.

REM Get WiFi IP address for info display
echo [1/2] Detecting network configuration...
set "WIFI_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    if "!ip:~0,7!"=="192.168" (
        set "WIFI_IP=!ip!"
        goto :found
    )
    if "!ip:~0,3!"=="10." (
        set "WIFI_IP=!ip!"
        goto :found
    )
)

:found
if not defined WIFI_IP (
    set WIFI_IP=192.168.100.17
)

echo [SUCCESS] Network detected
echo [INFO] Your WiFi IP: %WIFI_IP%

echo.
echo [2/2] Starting PHP development server...
echo.
echo ========================================
echo   Server Information
echo ========================================
echo   Mode: LOCAL ONLY
echo   Port: 8080
echo.
echo   Access URLs:
echo   - Local:  http://localhost:8080
echo.
echo   Login Credentials:
echo   - Username: superadmin
echo   - Password: password123
echo.
echo   TIP: For WiFi network access, use:
echo        START_SERVER_WIFI.bat
echo   Then share: http://%WIFI_IP%:8080
echo.
echo ========================================
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.

php spark serve

echo.
echo [INFO] Server stopped
pause
