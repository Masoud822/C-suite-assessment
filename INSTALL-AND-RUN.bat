@echo off
title Setup & Launch - Sarah Safaa C-Suite Platform
echo ================================================================
echo    Sarah Safaa - C-Suite English Assessment Platform Setup
echo ================================================================
echo.

if not exist "node_modules\" (
    echo [1/3] Installing Frontend Dependencies...
    call npm install
) else (
    echo [1/3] Frontend dependencies ready.
)

if not exist "server\node_modules\" (
    echo [2/3] Installing Backend Dependencies...
    cd server
    call npm install
    cd ..
) else (
    echo [2/3] Backend dependencies ready.
)

echo [3/3] Starting Services...
echo.
start "C-Suite Backend API (Port 3000)" cmd /k "cd server && node index.js"
timeout /t 2 /nobreak >nul
start "C-Suite Frontend (Port 5173)" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo ================================================================
echo    Platform Started!
echo    Frontend: http://localhost:5173
echo    Admin Login: http://localhost:5173/admin/login
echo    (Admin User: admin  Password: admin@123123)
echo ================================================================
pause
