@echo off
REM ========================================
REM GoEvently - Complete Reset Script
REM WARNING: This DELETES ALL DATA!
REM ========================================

setlocal enabledelayedexpansion

REM Set console title
title GoEvently - RESET (DELETE ALL DATA)

echo.
echo ========================================
echo   GoEvently - COMPLETE RESET
echo ========================================
echo.
echo [WARNING] This will DELETE ALL DATA including:
echo   - All databases
echo   - All Kafka messages
echo   - All application data
echo.
set /p confirm="Type 'YES' to continue (WARNING - DATA LOSS): "

if /i not "%confirm%"=="YES" (
    echo [CANCELLED] Reset cancelled by user.
    pause
    exit /b 0
)

echo.
echo [STEP 1] Stopping all services...
taskkill /F /IM java.exe /T 2>nul
cd /d D:\Java\springboot\goevently\backend
docker-compose down 2>nul
echo [OK] Services stopped
echo.

echo [STEP 2] Removing Docker volumes (DELETE ALL DATA)...
docker volume rm backend_mysql_data 2>nul
echo [OK] Data deleted
echo.

echo [STEP 3] Removing Docker images...
docker rmi mysql:8.0 2>nul
docker rmi confluentinc/cp-kafka:7.4.0 2>nul
docker rmi confluentinc/cp-zookeeper:7.4.0 2>nul
echo [OK] Old images removed
echo.

echo.
echo ========================================
echo   Complete Reset Finished!
echo ========================================
echo.
echo All data has been deleted.
echo Run 'start-all-services.bat' to start fresh with new databases.
echo.
pause
