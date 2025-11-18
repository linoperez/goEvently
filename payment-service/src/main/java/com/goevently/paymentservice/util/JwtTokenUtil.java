package com.goevently.paymentservice.util;

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

    /**
     * Extract JWT token from Authorization header
     */
    public String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Validate and parse JWT token
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
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage());
            throw new RuntimeException("Error validating JWT token: " + e.getMessage(), e);
        }
    }

    /**
     * Extract userId from JWT claims
     */
    public Long getUserIdFromClaims(Claims claims) {
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

        String subject = claims.getSubject();
        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException e) {
            log.error("Subject claim is not numeric: {}", subject);
            throw new RuntimeException("Unable to extract userId from JWT", e);
        }
    }
}
