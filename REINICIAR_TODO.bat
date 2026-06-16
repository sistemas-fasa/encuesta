@echo off
title REINICIAR TODO - Sistema de Encuestas
color 0B

echo.
echo  ======================================================
echo   REINICIANDO TODOS LOS SERVICIOS...
echo  ======================================================
echo.

:: Puertos
set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set ROOT_DIR=%~dp0

:: 1. Limpiar puertos
echo  [1/3] Liberando puertos %BACKEND_PORT% y %FRONTEND_PORT%...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort %BACKEND_PORT% -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort %FRONTEND_PORT% -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"
timeout /t 2 /nobreak >nul


:: 2. Iniciar Backend
echo  [2/3] Iniciando Backend...
start "BACKEND" cmd /c "cd /d %ROOT_DIR%backend && node server.js"

:: 3. Iniciar Frontend
echo  [3/3] Iniciando Frontend...
start "FRONTEND" cmd /c "cd /d %ROOT_DIR% && npm run dev"

echo.
echo  ======================================================
echo   REINICIO COMPLETADO EXITOSAMENTE
echo  ======================================================
echo.
timeout /t 5
exit
