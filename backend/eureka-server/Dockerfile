FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY eureka-server/pom.xml ./eureka-server/

RUN mvn -B -f eureka-server/pom.xml dependency:go-offline

COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY event-service ./event-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

RUN mvn -pl eureka-server -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

COPY --from=builder /build/eureka-server/target/eureka-server-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
