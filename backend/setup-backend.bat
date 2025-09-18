@echo off
cd /d "C:\Users\KIIT0001\Documents\smart-wanderer-app\backend"
echo Current directory: %CD%
echo.
echo Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Setting up admin users...
call npm run seed

echo.
echo Starting backend server...
echo Backend API will be available at: http://localhost:5000
echo Admin API: http://localhost:5000/api/*
echo Health check: http://localhost:5000/health
echo.
call npm run dev
pause
