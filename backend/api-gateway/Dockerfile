FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY api-gateway/pom.xml ./api-gateway/

RUN mvn -B -f api-gateway/pom.xml dependency:go-offline

COPY api-gateway ./api-gateway
COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY event-service ./event-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service
COPY payment-service ./payment-service

RUN mvn -pl api-gateway -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/api-gateway/target/api-gateway-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser


EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
