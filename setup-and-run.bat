@echo off
cd /d "C:\Users\KIIT0001\Documents\smart-wanderer-app"
echo Current directory: %CD%
echo.
echo Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting frontend development server...
echo Frontend will be available at: http://localhost:8080
echo.
echo Note: You'll need to run the backend separately for full functionality
echo Backend setup: cd backend && npm install && npm run dev
echo.
call npm run dev
pause
