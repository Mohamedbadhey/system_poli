@echo off
echo Checking PHP error logs...
echo.

REM Check writable folder for CodeIgniter logs
if exist "writable\logs\" (
    echo === Latest CodeIgniter Log ===
    for /f "delims=" %%i in ('dir /b /o-d "writable\logs\*.log" 2^>nul') do (
        echo File: writable\logs\%%i
        type "writable\logs\%%i"
        goto :done
    )
) else (
    echo No writable\logs folder found
)

:done
echo.
echo === Check complete ===
pause
