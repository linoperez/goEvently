package com.goevently.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderRequest {
    private Long amount;           // Amount in paise (e.g., 5000 = 50 INR)
    private String currency;       // "INR"
    private String receipt;        // Unique receipt ID
    private Map<String, String> notes;  // Custom notes
}
