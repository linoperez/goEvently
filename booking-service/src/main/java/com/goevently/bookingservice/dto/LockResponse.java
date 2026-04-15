package com.goevently.bookingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LockResponse {
    private String lockId;
    private Long userId;
    private Long eventId;
    private Long ticketTierId;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String status;
}