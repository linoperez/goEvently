#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting GoEvently Services...${NC}\n"

# Function to start a service in background
start_service() {
    local name=$1
    local path=$2
    local port=$3

    echo -e "${YELLOW}Starting $name on port $port...${NC}"
    cd "$path"
    nohup mvn spring-boot:run > "$name.log" 2>&1 &
    echo -e "${GREEN}✅ $name started (PID: $!)${NC}"
    sleep 3
}

# Kill any existing Java processes (optional - for cleanup)
# pkill -f "spring-boot:run" 2>/dev/null || true

# 1. Start Kafka
echo -e "${YELLOW}1️⃣  Starting Kafka...${NC}"
cd D:/Kafka/kafka_4.1.0
nohup ./bin/windows/kafka-server-start.bat ./config/server.properties > kafka.log 2>&1 &
KAFKA_PID=$!
echo -e "${GREEN}✅ Kafka started (PID: $KAFKA_PID)${NC}"
sleep 5

# 2. Start Services
start_service "Eureka Server" "$(pwd)/eureka-server" "8761"
start_service "Auth Service" "$(pwd)/auth-service" "8081"
start_service "Event Service" "$(pwd)/event-service" "8082"
start_service "Notification Service" "$(pwd)/notification-service" "8083"
start_service "API Gateway" "$(pwd)/api-gateway" "8080"

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📊 Service URLs:${NC}"
echo -e "  Eureka: http://localhost:8761"
echo -e "  Auth: http://localhost:8081"
echo -e "  Event: http://localhost:8082"
echo -e "  Notification: http://localhost:8083"
echo -e "  API Gateway: http://localhost:8080"
echo -e "  Kafka: localhost:9092\n"

echo -e "${YELLOW}📝 Log files:${NC}"
echo -e "  eureka-server.log, auth-service.log, event-service.log, notification-service.log, api-gateway.log\n"

echo -e "${YELLOW}⏹️  To stop all services:${NC}"
echo -e "  pkill -f 'spring-boot:run'"
echo -e "  pkill -f 'kafka-server-start'\n"
