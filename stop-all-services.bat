@echo off
REM ========================================
REM GoEvently - Complete Shutdown Script
REM Windows Batch File
REM ========================================

setlocal enabledelayedexpansion

REM Set console title
title GoEvently - Shutdown

echo.
echo ========================================
echo   GoEvently - Stopping All Services
echo ========================================
echo.

REM Inform user
echo [INFO] This will gracefully shutdown all services...
echo.

REM Kill all Java processes (microservices)
echo [STEP 1] Stopping all Java microservices...
taskkill /F /IM java.exe /T 2>nul
timeout /t 2 /nobreak
echo [OK] Microservices stopped
echo.

REM Stop Docker containers gracefully
echo [STEP 2] Stopping Docker containers...
cd /d D:\Java\springboot\goevently\backend
docker-compose stop
echo [OK] Docker containers stopped
echo.

echo ========================================
echo   All Services Stopped!
echo ========================================
echo.
echo Data persisted in Docker volumes. To restart, run:
echo   start-all-services.bat
echo.
echo To completely reset (DELETE ALL DATA), run:
echo   docker volume rm backend_mysql_data
echo.
pause
