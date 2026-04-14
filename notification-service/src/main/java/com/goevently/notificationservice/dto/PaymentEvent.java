package com.goevently.notificationservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentEvent {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long eventId;
    private String orderId;
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String reason;
    private LocalDateTime createdAt;
}