package com.goevently.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long eventId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String paymentMethod;
    private String gatewayTxnId;
    private LocalDateTime paymentTime;
    private LocalDateTime createdAt;
    private String razorpayOrderId;  // For Razorpay orders
    private String razorpayPaymentId;  // After payment success
}
