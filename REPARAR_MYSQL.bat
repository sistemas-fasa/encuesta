@echo off
title REPARAR MYSQL - Sistema de Encuestas
color 0E

echo.
echo  ======================================================
echo   REPARADOR DE EMERGENCIA PARA MYSQL (XAMPP)
echo  ======================================================
echo.
echo  Detectado error: "Incorrect file format 'db'"
echo  Este proceso restaurara las tablas del sistema.
echo.

set XAMPP_MYSQL_DATA=C:\xampp\mysql\data
set XAMPP_MYSQL_BACKUP=C:\xampp\mysql\backup

:: 1. Cerrar procesos de MySQL
echo  [1/4] Cerrando cualquier instancia de MySQL...
taskkill /F /IM mysqld.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: 2. Renombrar carpeta actual
echo  [2/4] Creando respaldo de datos dañados...
if exist "%XAMPP_MYSQL_DATA%_broken" (
    echo       - Eliminando respaldo anterior...
    rd /s /q "%XAMPP_MYSQL_DATA%_broken"
)
move "%XAMPP_MYSQL_DATA%" "%XAMPP_MYSQL_DATA%_broken"

:: 3. Restaurar desde Backup
echo  [3/4] Restaurando archivos base desde backup...
mkdir "%XAMPP_MYSQL_DATA%"
xcopy /E /Y /I "%XAMPP_MYSQL_BACKUP%\*" "%XAMPP_MYSQL_DATA%\" >nul

:: 4. Recuperar base de datos de usuario
echo  [4/4] Recuperando base de datos 'encuestas' e 'ibdata1'...
xcopy /E /Y /I "%XAMPP_MYSQL_DATA%_broken\encuestas" "%XAMPP_MYSQL_DATA%\encuestas\" >nul
xcopy /E /Y /I "%XAMPP_MYSQL_DATA%_broken\tienda" "%XAMPP_MYSQL_DATA%\tienda\" >nul
copy /Y "%XAMPP_MYSQL_DATA%_broken\ibdata1" "%XAMPP_MYSQL_DATA%\ibdata1" >nul

echo.
echo  ======================================================
echo   REPARACION COMPLETADA
echo  ======================================================
echo.
echo  Por favor, intenta iniciar MySQL desde el Panel de XAMPP.
echo.
pause
exit
