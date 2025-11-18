package com.goevently.paymentservice.client;

import com.goevently.paymentservice.dto.RazorpayOrderRequest;
import com.goevently.paymentservice.dto.RazorpayOrderResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class MockRazorpayClient {

    /**
     * Mock Razorpay order creation
     * Returns a fake order ID without hitting Razorpay API
     */
    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) {
        log.info("🧪 MOCK: Creating Razorpay order for amount: {} {}", request.getAmount(), request.getCurrency());

        // Generate a fake but valid-looking Razorpay order ID
        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18);

        RazorpayOrderResponse response = RazorpayOrderResponse.builder()
                .id(orderId)
                .entity("order")
                .amount(request.getAmount())
                .amountPaid(0L)  // Not paid yet
                .amountDue(request.getAmount())
                .currency(request.getCurrency())
                .receipt(request.getReceipt())
                .status("created")
                .attempts(0L)
                .notes(request.getNotes() != null ? request.getNotes().toString() : "")
                .createdAt(System.currentTimeMillis() / 1000)
                .build();

        log.info("🧪 MOCK: Order created successfully. Order ID: {}", orderId);
        return response;
    }

    /**
     * Mock payment verification
     * Always returns true in test mode
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        log.info("🧪 MOCK: Verifying payment signature (always true in mock mode)");
        return true;  // Always succeed in test mode
    }

    /**
     * Mock fetch order
     */
    public RazorpayOrderResponse fetchOrder(String orderId) {
        log.info("🧪 MOCK: Fetching order: {}", orderId);

        return RazorpayOrderResponse.builder()
                .id(orderId)
                .entity("order")
                .amount(5000L)
                .amountPaid(5000L)
                .amountDue(0L)
                .currency("INR")
                .receipt("receipt_1")
                .status("paid")
                .attempts(1L)
                .createdAt(System.currentTimeMillis() / 1000)
                .build();
    }
}
