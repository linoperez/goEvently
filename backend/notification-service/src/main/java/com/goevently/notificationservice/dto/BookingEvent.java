package com.goevently.notificationservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingEvent {
    private Long id;
    private Long userId;
    private Long eventId;
    private Long ticketTierId;
    private Integer quantity;
    private String status;
    private Integer seats;
    private String paymentId;
    private BigDecimal totalAmount;
    private String currency;
    private LocalDateTime bookingTime;
}