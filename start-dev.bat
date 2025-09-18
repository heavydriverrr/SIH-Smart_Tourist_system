@echo off
echo ===================================
echo   SMART WANDERER DEV STARTUP
echo ===================================
echo.

REM Set window titles and start servers in separate windows
echo Starting Backend Server...
start "Smart Wanderer Backend" cmd /k "cd backend && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Smart Wanderer Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting up...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo Admin Login: http://localhost:8080/admin/login
echo.
echo Admin Credentials:
echo Email: admin@smartwanderer.com
echo Password: admin123456
echo.
echo Press any key to exit startup script...
pause > nul