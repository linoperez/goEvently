package com.goevently.bookingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * Kafka message for booking events.
 * We keep "seats" for backward compatibility, but it represents quantity for now.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMessage {

    private Long id;
    private Long userId;
    private Long eventId;

    // Phase 1 fields
    private Long ticketTierId;
    private Integer quantity;

    private String status;

    // Backward compatibility: old consumers may still read seats
    private Integer seats;
    private BigDecimal totalAmount;
    private String currency;

    private String paymentId;
    private LocalDateTime bookingTime;
}