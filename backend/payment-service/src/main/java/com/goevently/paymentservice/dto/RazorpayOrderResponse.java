package com.goevently.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponse {
    private String id;
    private String entity;
    private Long amount;
    @JsonProperty("amount_paid")
    private Long amountPaid;
    @JsonProperty("amount_due")
    private Long amountDue;
    private String currency;
    private String receipt;
    private String status;
    private Long attempts;
    private String notes;
    @JsonProperty("created_at")
    private Long createdAt;
}
