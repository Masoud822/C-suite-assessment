@echo off
title Sarah Safaa - C-Suite English Assessment Platform
echo ========================================================
echo   Sarah Safaa - C-Suite English Assessment Platform
echo ========================================================
echo.
echo Starting Backend API Server (Port 3000)...
start "C-Suite Backend" cmd /k "cd server && node index.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Web App (Port 5173)...
start "C-Suite Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   Platform is running!
echo   Frontend: http://localhost:5173
echo   Admin Login: http://localhost:5173/admin/login
echo   (Default Admin User: admin  Password: admin@123123)
echo ========================================================
pause
