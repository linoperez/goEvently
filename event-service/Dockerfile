FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY event-service/pom.xml ./event-service/

RUN mvn -B -f event-service/pom.xml dependency:go-offline

COPY event-service ./event-service
COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

RUN mvn -pl event-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/event-service/target/event-service-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
