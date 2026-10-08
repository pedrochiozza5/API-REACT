@echo off
chcp 65001 >nul
title Bien Amargos + Bien Yerbados - Instalacion

echo ==============================================
echo   RONDA DUAL V3 - INSTALACION LOCAL
echo ==============================================
echo.
if not exist .env (
  copy .env.example .env >nul
  echo Se creo .env desde .env.example.
  echo EDITALO AHORA con los datos de tu MySQL antes de seguir.
  echo.
  pause
  exit /b 0
)

echo [1/3] Instalando dependencias...
call npm install || goto :error

echo [2/3] Creando tablas...
call npm run db:init || goto :error

echo [3/3] Cargando datos iniciales...
call npm run db:seed || goto :error

echo.
echo LISTO. Ejecuta 02_INICIAR_LOCAL.bat
pause
exit /b 0

:error
echo.
echo Ocurrio un error. Revisa .env y que MySQL este iniciado.
pause
exit /b 1
