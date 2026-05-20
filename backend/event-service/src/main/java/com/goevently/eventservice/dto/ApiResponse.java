package com.goevently.eventservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    // ✅ Static factory method for success with data
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    // ✅ Static factory method for success without data
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    // ✅ Static factory method for error response
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }

    // ✅ For paginated responses
    public static <T> ApiResponse<PaginatedResponse<T>> paginated(String message, PaginatedResponse<T> pageData) {
        return ApiResponse.<PaginatedResponse<T>>builder()
                .success(true)
                .message(message)
                .data(pageData)
                .build();
    }
}
