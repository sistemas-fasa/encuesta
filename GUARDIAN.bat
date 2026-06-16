@echo off
setlocal enabledelayedexpansion
title GUARDIAN DE SERVICIOS - Monitor Activo
color 0F

:: --- CONFIGURA LOS PUERTOS Y RUTAS AQUÍ ---
set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set BACKEND_URL=http://localhost:%BACKEND_PORT%/api/ping
set FRONTEND_URL=http://localhost:%FRONTEND_PORT%
set CHECK_INTERVAL=30
set ROOT_DIR=%~dp0

echo.
echo  ======================================================
13: echo   GUARDIAN DEL SISTEMA DE ENCUESTAS - V1.0
14: echo  ======================================================
echo   Este script monitorea el estado del servidor.
echo   Si detecta una caida, reiniciara el servicio solo.
echo   NO CIERRES ESTA VENTANA.
echo  ======================================================
echo.

:LOOP
set BACKEND_STATUS=DOWN
set FRONTEND_STATUS=DOWN

:: 1. Verificar Backend
curl -s --max-time 5 %BACKEND_URL% | findstr "pong" >nul
if %errorlevel% equ 0 (
    set BACKEND_STATUS=OK
) else (
    color 0C
    echo [%TIME%] [PELIGRO] Backend no responde. Reiniciando...
    
    :: Cerrar procesos en el puerto 3001
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    
    :: Iniciar Backend en ventana nueva
    start "BACKEND - REINICIADO" cmd /c "cd /d %ROOT_DIR%backend && echo REINICIANDO BACKEND... && node server.js"
    timeout /t 5 >nul
    color 0F
)

:: 2. Verificar Frontend
curl -I -s --max-time 5 %FRONTEND_URL% >nul
if %errorlevel% equ 0 (
    set FRONTEND_STATUS=OK
) else (
    color 0E
    echo [%TIME%] [ADVERTENCIA] Frontend no responde. Reiniciando...
    
    :: Cerrar procesos en el puerto 5173
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    
    :: Iniciar Frontend en ventana nueva
    start "FRONTEND - REINICIADO" cmd /c "cd /d %ROOT_DIR% && echo REINICIANDO FRONTEND... && npm run dev"
    timeout /t 5 >nul
    color 0F
)

:: 3. Mostrar resumen
set "GREEN_TEXT=[92m"
set "RED_TEXT=[91m"
set "RESET_TEXT=[0m"

echo [%TIME%] Estado: Backend [!BACKEND_STATUS!] ^| Frontend [!FRONTEND_STATUS!]
echo       Esperando %CHECK_INTERVAL% segundos para el proximo chequeo...

timeout /t %CHECK_INTERVAL% /nobreak >nul
goto LOOP
