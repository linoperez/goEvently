@echo off
REM ========================================
REM GoEvently - Complete Startup Script
REM Windows Batch File - Multi-Module Maven
REM ========================================

setlocal enabledelayedexpansion

REM Set console title
title GoEvently - Startup

echo.
echo ========================================
echo   GoEvently - Complete Startup
echo ========================================
echo.

REM Check if Docker is running
echo [CHECK] Verifying Docker Desktop is running...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop is NOT running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Set backend directory
set BACKEND_DIR=D:\Java\springboot\goevently\backend

REM Step 1: Start Docker containers
echo [STEP 1/8] Starting Docker containers (Kafka, Zookeeper, MySQL)...
cd /d %BACKEND_DIR%
docker-compose down 2>nul
docker-compose up -d kafka zookeeper mysql
if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers!
    pause
    exit /b 1
)
echo [OK] Docker containers started
echo.

REM Wait for MySQL to be healthy
echo [WAIT] Waiting for MySQL to be ready (15 seconds)...
timeout /t 15 /nobreak
echo.

REM Step 2: Start Eureka Server
echo [STEP 2/8] Starting Eureka Server ^(Port 8761^)...
start "Eureka Server" cmd /k "cd /d %BACKEND_DIR% && mvn -pl eureka-server spring-boot:run"
timeout /t 8 /nobreak
echo [OK] Eureka Server starting in new window
echo.

REM Step 3: Start Auth Service
echo [STEP 3/8] Starting Auth Service ^(Port 8081^)...
start "Auth Service" cmd /k "cd /d %BACKEND_DIR% && mvn -pl auth-service spring-boot:run"
timeout /t 5 /nobreak
echo [OK] Auth Service starting in new window
echo.

REM Step 4: Start Event Service
echo [STEP 4/8] Starting Event Service ^(Port 8082^)...
start "Event Service" cmd /k "cd /d %BACKEND_DIR% && mvn -pl event-service spring-boot:run"
timeout /t 5 /nobreak
echo [OK] Event Service starting in new window
echo.

REM Step 5: Start Notification Service
echo [STEP 5/8] Starting Notification Service ^(Port 8083^)...
start "Notification Service" cmd /k "cd /d %BACKEND_DIR% && mvn -pl notification-service spring-boot:run"
timeout /t 5 /nobreak
echo [OK] Notification Service starting in new window
echo.

REM Step 6: Start Booking Service
echo [STEP 6/8] Starting Booking Service ^(Port 8084^)...
start "Booking Service" cmd /k "cd /d %BACKEND_DIR% && mvn -pl booking-service spring-boot:run"
timeout /t 5 /nobreak
echo [OK] Booking Service starting in new window
echo.

REM Step 7: Start Payment Service
echo [STEP 7/8] Starting Payment Service ^(Port 8085^)...
start "Payment Service" cmd /k "cd /d %BACKEND_DIR% && mvn -pl payment-service spring-boot:run"
timeout /t 5 /nobreak
echo [OK] Payment Service starting in new window
echo.

REM Step 8: Start API Gateway
echo [STEP 8/8] Starting API Gateway ^(Port 8080^)...
start "API Gateway" cmd /k "cd /d %BACKEND_DIR% && mvn -pl api-gateway spring-boot:run"
timeout /t 3 /nobreak
echo [OK] API Gateway starting in new window
echo.

echo.
echo ========================================
echo   All Services Startup Complete!
echo ========================================
echo.
echo SERVICE STATUS:
echo   Eureka Dashboard: http://localhost:8761
echo   API Gateway:      http://localhost:8080
echo   Auth Service:     http://localhost:8081
echo   Event Service:    http://localhost:8082
echo   Notification:     http://localhost:8083
echo   Booking Service:  http://localhost:8084
echo   Payment Service:  http://localhost:8085
echo.
echo DOCKER CONTAINERS:
echo   Kafka:            localhost:9092
echo   Zookeeper:        localhost:2181
echo   MySQL:            localhost:3306
echo.
echo All 7 microservices and Docker containers are starting in separate windows...
echo Services will be ready in approximately 30-40 seconds.
echo.
pause
