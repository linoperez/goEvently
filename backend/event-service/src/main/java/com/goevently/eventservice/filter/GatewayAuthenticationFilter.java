package com.goevently.eventservice.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String username = request.getHeader("X-User-Username");
        String userId = request.getHeader("X-User-Id");
        String role = request.getHeader("X-User-Role");

        if (username != null && role != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority(authority))
                    );

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            request.setAttribute("userId", userId);
            request.setAttribute("username", username);
            request.setAttribute("userRole", role);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Gateway auth set for user={}, userId={}, role={}", username, userId, authority);
        }

        filterChain.doFilter(request, response);
    }
}