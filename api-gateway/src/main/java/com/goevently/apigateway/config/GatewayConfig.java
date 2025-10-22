package com.goevently.apigateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
//import org.springframework.cloud.gateway.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway routing configuration.
 * Defines how requests are routed to different microservices.
 */
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // Auth Service Routes
                .route("auth-service", r -> r
                        .path("/api/auth/**")
                        .uri("lb://auth-service"))

                // Event Service Routes
                .route("event-service", r -> r
                        .path("/api/events/**")
                        .uri("lb://event-service"))

                // Future Booking Service Routes
                .route("booking-service", r -> r
                        .path("/api/bookings/**")
                        .uri("lb://booking-service"))

                // Future Payment Service Routes
                .route("payment-service", r -> r
                        .path("/api/payments/**")
                        .uri("lb://payment-service"))

                // Future Notification Service Routes
                .route("notification-service", r -> r
                        .path("/api/notifications/**")
                        .uri("lb://notification-service"))

                // Future Admin Service Routes
                .route("admin-service", r -> r
                        .path("/api/admin/**")
                        .uri("lb://admin-service"))

                // Health Check Routes (for all services)
                .route("health-check", r -> r
                        .path("/actuator/**")
                        .uri("lb://eureka-server"))

                .build();
    }
}
