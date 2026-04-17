package com.goevently.bookingservice.dto;

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
    private String gatewayTxnId;
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String reason;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime paymentTime;
}