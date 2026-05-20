FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY payment-service/pom.xml ./payment-service/

RUN mvn -B -f payment-service/pom.xml dependency:go-offline

COPY payment-service ./payment-service
COPY eureka-server ./eureka-server
COPY auth-service ./auth-service
COPY event-service ./event-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service
COPY api-gateway ./api-gateway

RUN mvn -pl payment-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/payment-service/target/payment-service-*.jar app.jar

RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
