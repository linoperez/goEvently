package com.goevently.authservice.controller;

import com.goevently.authservice.dto.LoginRequest;
import com.goevently.authservice.dto.RegisterRequest;
import com.goevently.authservice.dto.AuthResponse;
import com.goevently.authservice.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for handling authentication-related API requests.
 * Now uses DTOs instead of entity classes directly.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint for user registration.
     * Now uses RegisterRequest DTO instead of User entity.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerUser(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Endpoint for user login.
     * Now uses LoginRequest DTO and returns AuthResponse DTO.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.authenticateUser(request);
        return ResponseEntity.ok(response);
    }
}
