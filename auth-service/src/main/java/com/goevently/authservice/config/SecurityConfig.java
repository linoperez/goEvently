// File: backend/auth-service/src/main/java/com/goevently/authservice/config/SecurityConfig.java

package com.goevently.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity // Enables Spring Security's web security support
public class SecurityConfig {

    /**
     * Configures the security filter chain.
     *
     * @param http The HttpSecurity object to configure.
     * @return The configured SecurityFilterChain.
     * @throws Exception if an error occurs.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        // Allow public access to the registration and login endpoints
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        // Allow access to actuator endpoints for monitoring/debugging
                        .requestMatchers("/actuator/**").permitAll()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                );

        return http.build();
    }




    /**
     * Provides a password encoder bean.
     *
     * @return A BCryptPasswordEncoder instance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}