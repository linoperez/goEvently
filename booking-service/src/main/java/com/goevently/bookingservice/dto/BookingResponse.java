package com.goevently.bookingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private Long userId;
    private Long eventId;

    // Phase 1 fields
    private Long ticketTierId;
    private Integer quantity;

    private BigDecimal totalAmount;
    private String currency;

    private String status;
    private String paymentId;
    private String txnRef;

    private LocalDateTime bookingTime;
    private LocalDateTime createdAt;
}