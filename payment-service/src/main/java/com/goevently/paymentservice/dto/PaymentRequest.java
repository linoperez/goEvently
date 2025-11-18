package com.goevently.paymentservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Event ID is required")
    private Long eventId;  // ADD THIS LINE

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Currency is required")
    private String currency;

    @NotNull(message = "Payment method is required")
    private String paymentMethod;
}
