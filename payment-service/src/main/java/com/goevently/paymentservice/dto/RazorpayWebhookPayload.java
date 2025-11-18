package com.goevently.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayWebhookPayload {
    private String event;
    private Map<String, Object> payload;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Payment {
        private String id;
        @JsonProperty("order_id")
        private String orderId;
        private Long amount;
        private String currency;
        private String status;
        private String method;
        @JsonProperty("acquirer_data")
        private Map<String, String> acquirerData;
    }
}
