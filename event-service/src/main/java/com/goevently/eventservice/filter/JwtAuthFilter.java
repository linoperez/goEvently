package com.goevently.eventservice.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Key;
import java.util.List;

/**
 * JWT Authentication Filter for event-service.
 * Validates JWT tokens from auth-service and sets authentication context.
 */
@Component
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Skip filter if no Authorization header or not a Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the JWT token
        jwt = authHeader.substring(7);

        try {
            // Parse and validate the token using the SAME secret as auth-service
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody();

            username = claims.getSubject();
            String role = claims.get("role", String.class);
            Long userId = claims.get("userId", Long.class);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Create authorities based on role
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER"))
                );

                log.debug("JWT validated for user: {}, role: {}, userId: {}", username, role, userId);

                // Create authentication token with authorities
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);

                // Add custom details
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // You can also store userId in request attributes for later use
                request.setAttribute("userId", userId);
                request.setAttribute("userRole", role);

                // Set the authentication in the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid or expired token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
