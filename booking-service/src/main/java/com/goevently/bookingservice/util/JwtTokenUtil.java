package com.goevently.bookingservice.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class JwtTokenUtil {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:86400000}")
    private long jwtExpirationMs;

    /**
     * Extract JWT token from Authorization header
     * Format: "Bearer <token>"
     */
    public String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7); // Remove "Bearer " prefix
        }
        return null;
    }

    /**
     * Validate and parse JWT token
     * Returns Claims if valid, throws exception if invalid
     */
    public Claims validateAndParseToken(String token) {
        try {
            log.debug("Validating JWT token...");

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            log.debug("JWT token is valid. Subject: {}", claims.getSubject());
            return claims;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("JWT token has expired");
            throw new RuntimeException("JWT token has expired", e);
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            log.error("Invalid JWT token");
            throw new RuntimeException("Invalid JWT token", e);
        } catch (io.jsonwebtoken.UnsupportedJwtException e) {
            log.error("JWT token is unsupported");
            throw new RuntimeException("JWT token is unsupported", e);
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty");
            throw new RuntimeException("JWT claims string is empty", e);
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage());
            throw new RuntimeException("Error validating JWT token: " + e.getMessage(), e);
        }
    }

    /**
     * Extract userId (subject) from JWT claims
     */
    /**
     * Extract userId from JWT claims
     * First tries to get from custom "userId" claim
     * Falls back to subject if userId claim not found
     */
    public Long getUserIdFromClaims(Claims claims) {
        // Try to get userId from custom claim first (recommended approach)
        Object userIdClaim = claims.get("userId");

        if (userIdClaim != null) {
            try {
                if (userIdClaim instanceof Integer) {
                    return ((Integer) userIdClaim).longValue();
                } else if (userIdClaim instanceof Long) {
                    return (Long) userIdClaim;
                } else {
                    return Long.valueOf(userIdClaim.toString());
                }
            } catch (NumberFormatException e) {
                log.error("Invalid userId format in JWT custom claim: {}", userIdClaim);
                throw new RuntimeException("Invalid userId format in JWT custom claim", e);
            }
        }

        // Fallback to subject claim if userId not available
        String subject = claims.getSubject();
        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException e) {
            log.error("Subject claim is not numeric (userId not found in custom claims): {}", subject);
            throw new RuntimeException("Unable to extract userId from JWT. userId custom claim or numeric subject required.", e);
        }
    }


    /**
     * Extract roles from JWT claims
     */
    public List<String> getRolesFromClaims(Claims claims) {
        return claims.get("roles", List.class);
    }

    /**
     * Extract username from JWT claims
     */
    public String getUsernameFromClaims(Claims claims) {
        return claims.get("username", String.class);
    }
}
