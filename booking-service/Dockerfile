FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY booking-service/pom.xml ./booking-service/

RUN mvn -B -f booking-service/pom.xml dependency:go-offline

COPY booking-service ./booking-service
COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY event-service ./event-service
COPY notification-service ./notification-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

RUN mvn -pl booking-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/booking-service/target/booking-service-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
