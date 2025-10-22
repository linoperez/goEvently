package com.goevently.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security configuration for API Gateway.
 * Disables default security to use custom JWT validation.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .anyExchange().permitAll() // We handle auth in our custom filters
                )
                .build();
    }
}



//package com.goevently.apigateway.config;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
//import org.springframework.security.config.web.server.ServerHttpSecurity;
//import org.springframework.security.web.server.SecurityWebFilterChain;
//
///**
// * Security configuration for API Gateway, updated for Spring Boot 3.x.
// * Disables default security and sets up path-based authorization,
// * allowing custom filters to handle JWT validation for protected routes.
// */
//@Configuration
//@EnableWebFluxSecurity
//public class SecurityConfig {
//
//    @Bean
//    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
//        return http
//                // Disable CSRF protection, as it's not needed for a stateless API gateway
//                .csrf(ServerHttpSecurity.CsrfSpec::disable)
//
//                // Define authorization rules for different paths
//                .authorizeExchange(exchanges -> exchanges
//                        // Allow public access to authentication endpoints (register, login)
//                        .pathMatchers("/api/auth/**").permitAll()
//
//                        // Allow access to actuator health endpoints for monitoring
//                        .pathMatchers("/actuator/**").permitAll()
//
//                        // All other requests must be authenticated
//                        .anyExchange().authenticated()
//                )
//                .build();
//    }
//}
