@echo off
echo Starting Smart Wanderer Admin System...

echo.
echo Starting Backend Server on port 3001...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server on port 8080...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Waiting for servers to start...
timeout /t 10 /nobreak > nul

echo.
echo Testing connections...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/health' -Method GET -TimeoutSec 5 | Out-Null; Write-Host 'Backend: OK' } catch { Write-Host 'Backend: FAILED' }"
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080' -Method GET -TimeoutSec 5 | Out-Null; Write-Host 'Frontend: OK' } catch { Write-Host 'Frontend: FAILED' }"

echo.
echo ========================================
echo  Smart Wanderer Admin System Started  
echo ========================================
echo  Frontend: http://localhost:8080/
echo  Admin:    http://localhost:8080/admin/login
echo  Backend:  http://localhost:3001/
echo ========================================
echo.
echo Credentials:
echo  Email: admin@smartwanderer.com
echo  Password: admin123456
echo.
pause