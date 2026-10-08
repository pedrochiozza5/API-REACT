@echo off
chcp 65001 >nul
title Bien Amargos + Bien Yerbados - Local

echo ==============================================
echo   RONDA DUAL V3 - DESARROLLO LOCAL
echo ==============================================
echo.
echo Tienda: http://localhost:5173
echo Admin:  http://localhost:5173/admin/login
echo.
call npm run dev
pause
