package com.goevently.paymentservice.controller;

import com.goevently.paymentservice.dto.ApiResponse;
import com.goevently.paymentservice.dto.PaymentRequest;
import com.goevently.paymentservice.dto.PaymentResponse;
import com.goevently.paymentservice.service.PaymentService;
import com.goevently.paymentservice.util.JwtTokenUtil;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/payments")
@Slf4j
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    /**
     * Initiate a new payment
     * POST /api/payments
     *
     * Request:
     * {
     *   "bookingId": 1,
     *   "amount": 5000.00,
     *   "currency": "INR",
     *   "paymentMethod": "CREDIT_CARD"
     * }
     *
     * Response: PaymentResponse with Razorpay order ID
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) throws IOException {

        log.info("Received payment initiation request for booking: {}", request.getBookingId());

        // Extract and validate JWT
        String token = jwtTokenUtil.extractTokenFromHeader(authHeader);
        if (token == null) {
            log.error("Missing or invalid Authorization header");
            throw new RuntimeException("Missing or invalid Authorization header");
        }

        Claims claims = jwtTokenUtil.validateAndParseToken(token);
        Long userId = jwtTokenUtil.getUserIdFromClaims(claims);

        log.info("Initiating payment for user: {}", userId);

        // Initiate payment
        PaymentResponse payment = paymentService.initiatePayment(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PaymentResponse>builder()
                        .success(true)
                        .message("Payment initiated successfully. Please complete payment using Razorpay order ID.")
                        .data(payment)
                        .build());
    }

    /**
     * Get payment details by payment ID
     * GET /api/payments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable Long id) {
        log.info("Fetching payment with ID: {}", id);

        PaymentResponse payment = paymentService.getPayment(id);

        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment retrieved successfully")
                .data(payment)
                .build());
    }

    /**
     * Get payment by booking ID
     * GET /api/payments/booking/{bookingId}
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBookingId(@PathVariable Long bookingId) {
        log.info("Fetching payment for booking: {}", bookingId);

        PaymentResponse payment = paymentService.getPaymentByBookingId(bookingId);

        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment retrieved successfully")
                .data(payment)
                .build());
    }

    /**
     * Get all payments for a user (paginated)
     * GET /api/payments/user/{userId}?page=0&size=10
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getUserPayments(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Fetching payments for user: {}", userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<PaymentResponse> payments = paymentService.getUserPayments(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<PaymentResponse>>builder()
                .success(true)
                .message("User payments retrieved successfully")
                .data(payments)
                .build());
    }

    /**
     * Verify payment and process callback from Razorpay
     * POST /api/payments/verify
     *
     * This is called by frontend after Razorpay payment is completed
     *
     * Request:
     * {
     *   "orderId": "order_xxxxx",
     *   "paymentId": "pay_xxxxx",
     *   "signature": "xxxxx"
     * }
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @RequestBody VerifyPaymentRequest request) {

        log.info("Verifying payment for order: {}, payment: {}", request.getOrderId(), request.getPaymentId());

        PaymentResponse payment = paymentService.verifyAndProcessPayment(
                request.getOrderId(),
                request.getPaymentId(),
                request.getSignature()
        );

        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment verified and processed successfully")
                .data(payment)
                .build());
    }

    /**
     * Handle failed payment
     * POST /api/payments/{orderId}/failed
     */
    @PostMapping("/{orderId}/failed")
    public ResponseEntity<ApiResponse<PaymentResponse>> failPayment(
            @PathVariable String orderId,
            @RequestParam(required = false, defaultValue = "Payment failed") String reason) {

        log.warn("Payment failed for order: {}, reason: {}", orderId, reason);

        PaymentResponse payment = paymentService.handleFailedPayment(orderId, reason);

        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment marked as failed")
                .data(payment)
                .build());
    }

    /**
     * Refund a successful payment
     * POST /api/payments/{id}/refund
     */
    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(@PathVariable Long id) {
        log.info("Refunding payment: {}", id);

        PaymentResponse payment = paymentService.refundPayment(id);

        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment refunded successfully")
                .data(payment)
                .build());
    }

    /**
     * Razorpay Webhook Endpoint (No authentication required)
     * POST /api/payments/webhook/razorpay
     *
     * This is called by Razorpay servers when payment status changes
     */
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<ApiResponse<Object>> handleRazorpayWebhook(@RequestBody WebhookRequest request) {
        log.info("Received Razorpay webhook: {}", request.getEvent());

        try {
            if ("payment.authorized".equals(request.getEvent())) {
                // Payment successful
                String orderId = (String) request.getPayload().get("order_id");
                String paymentId = (String) request.getPayload().get("id");
                String signature = (String) request.getPayload().get("signature");

                paymentService.verifyAndProcessPayment(orderId, paymentId, signature);
            } else if ("payment.failed".equals(request.getEvent())) {
                // Payment failed
                String orderId = (String) request.getPayload().get("order_id");
                String reason = (String) request.getPayload().getOrDefault("description", "Unknown reason");

                paymentService.handleFailedPayment(orderId, reason);
            }

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Webhook processed successfully")
                    .build());
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.builder()
                            .success(false)
                            .message("Error processing webhook: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Inner class for verify payment request
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VerifyPaymentRequest {
        private String orderId;
        private String paymentId;
        private String signature;
    }

    /**
     * Inner class for webhook request
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WebhookRequest {
        private String event;
        private java.util.Map<String, Object> payload;
    }
}
