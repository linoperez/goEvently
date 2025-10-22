package com.goevently.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for user login requests.
 * Supports login with either username or email.
 */
@Data
public class LoginRequest {
    @NotBlank(message = "Username or email cannot be blank")
    private String usernameOrEmail;  // ✅ Changed from "username" to accept both

    @NotBlank(message = "Password cannot be blank")
    private String password;
}
