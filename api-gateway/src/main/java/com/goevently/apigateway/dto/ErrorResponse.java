package com.goevently.apigateway.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;

    // Jackson will now serialize this as ISO-8601 string
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime timestamp;

    private String path;

    // Constructor that auto-generates timestamp
    public ErrorResponse(int status, String message, String path) {
        this.status = status;
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.path = path;
    }
}
