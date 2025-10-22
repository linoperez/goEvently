package com.goevently.authservice.service;

import com.goevently.authservice.dto.AuthResponse;
import com.goevently.authservice.dto.LoginRequest;
import com.goevently.authservice.dto.RegisterRequest;
import com.goevently.authservice.entity.Role;
import com.goevently.authservice.entity.User;
import com.goevently.authservice.exception.AuthException;  // ← NEW IMPORT
import com.goevently.authservice.repository.UserRepository;
import com.goevently.authservice.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;  // ← NEW IMPORT
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j  // ← NEW ANNOTATION for logging
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse registerUser(RegisterRequest request) {
        log.info("Attempting to register user: {}", request.getUsername());

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AuthException("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthException("Email already exists");
        }

        // ✅ NEW: Parse role from request, default to USER if not provided
        Role userRole = Role.USER; // Default
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                userRole = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AuthException("Invalid role: " + request.getRole() +
                        ". Valid roles are: USER, ORGANIZER, ADMIN");
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)  // ✅ Use parsed role instead of hardcoded USER
                .build();

        User savedUser = userRepository.save(user);

        // ✅ NEW: Generate token with role and userId
        String token = jwtUtil.generateToken(
                savedUser.getUsername(),
                savedUser.getRole().name(),
                savedUser.getId()
        );

        log.info("User registered successfully: {} with role: {}",
                savedUser.getUsername(), savedUser.getRole());

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully")
                .jwt(token)
                .username(savedUser.getUsername())
                .role(savedUser.getRole().name())
                .userId(savedUser.getId())
                .build();
    }


    public AuthResponse authenticateUser(LoginRequest request) {
        String usernameOrEmail = request.getUsernameOrEmail();
        log.info("Attempting to authenticate user with identifier: {}", usernameOrEmail);

        // ✅ NEW: Find user by username OR email
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new AuthException("Invalid username/email or password"));

        // ✅ Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid username/email or password");
        }

        // Generate token with role and userId
        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name(),
                user.getId()
        );

        log.info("User authenticated successfully: {} (ID: {}) with role: {}",
                user.getUsername(), user.getId(), user.getRole());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .jwt(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

}
