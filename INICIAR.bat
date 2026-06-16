@echo off
setlocal enabledelayedexpansion
title Sistema de Encuestas - Lanzador

:: --- CONFIGURACION ---
set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set ROOT_DIR=%~dp0

color 0F
echo.
echo  ======================================================
echo   SISTEMA DE ENCUESTAS - INICIADOR PROFESIONAL
echo  ======================================================
echo.

:: 1. Verificar Node.js
echo  [1/5] Verificando entorno...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js no esta instalado. Descargalo de https://nodejs.org/
    pause
    exit
)
echo       - Node.js detectado.

:: 2. Limpieza Opcional (Caché Vite)
echo  [2/5] ¿Deseas limpiar la caché de la aplicación? (Opcional)
echo       - Presiona [S] para limpiar y prevenir errores de carga.
echo       - Presiona cualquier tecla para continuar directo.
choice /c sn /t 3 /d n >nul
if %errorlevel% equ 1 (
    echo       - Limpiando caché de Vite...
    if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
    echo       - Caché eliminada.
)

:: 3. Limpiar puertos
echo  [3/5] Liberando puertos %BACKEND_PORT% y %FRONTEND_PORT%...
for %%p in (%BACKEND_PORT% %FRONTEND_PORT%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%%p .*LISTENING"') do (
        echo       - Cerrando proceso anterior en puerto %%p (PID: %%a)...
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 1 /nobreak >nul

:: 4. Iniciar Backend
echo  [4/5] Iniciando Servidor de Datos (Backend)...
start "CEM - BACKEND (3001)" cmd /k "cd /d %ROOT_DIR%backend && color 0B && echo INICIANDO BACKEND... && node server.js || echo Error al iniciar Backend && pause"

:: 5. Iniciar Frontend
echo  [5/5] Iniciando Interfaz CEM (5173)...
start "CEM - FRONTEND (5173)" cmd /k "cd /d %ROOT_DIR% && color 0D && echo INICIANDO FRONTEND... && npm run dev || echo Error al iniciar Frontend && pause"

:: 5. Abrir Navegador
echo.
echo  [OK] Todos los servicios se han solicitado.
echo       Esperando un momento para abrir el navegador...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  ======================================================
echo   SISTEMA ACTIVO
echo   - Backend:  http://localhost:3001
echo   - Frontend: http://localhost:5173
echo  ======================================================
echo.
echo  Podes minimizar esta ventana.
echo  Si algun servidor falla, veras el error en su propia ventana.
echo.
pause
