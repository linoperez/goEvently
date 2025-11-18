FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY auth-service/pom.xml ./auth-service/

RUN mvn -B -f auth-service/pom.xml dependency:go-offline

COPY auth-service ./auth-service
COPY eureka-server ./eureka-server
COPY event-service ./event-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

RUN mvn -pl auth-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/auth-service/target/auth-service-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
