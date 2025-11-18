FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY notification-service/pom.xml ./notification-service/

RUN mvn -B -f notification-service/pom.xml dependency:go-offline

COPY notification-service ./notification-service
COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY event-service ./event-service
COPY booking-service ./booking-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

RUN mvn -pl notification-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/notification-service/target/notification-service-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
