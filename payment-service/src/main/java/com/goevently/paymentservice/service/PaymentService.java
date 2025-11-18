package com.goevently.paymentservice.service;

import com.goevently.paymentservice.client.RazorpayClient;
import com.goevently.paymentservice.dto.*;
import com.goevently.paymentservice.entity.Payment;
import com.goevently.paymentservice.entity.PaymentMethod;
import com.goevently.paymentservice.entity.PaymentStatus;
import com.goevently.paymentservice.repository.PaymentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RazorpayClient razorpayClient;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    /**
     * Initiate payment - Create Razorpay order
     */
    public PaymentResponse initiatePayment(Long userId, PaymentRequest request) throws IOException {
        log.info("Initiating payment for user: {}, booking: {}, amount: {}", userId, request.getBookingId(), request.getAmount());

        // Check if payment already exists for this booking
        if (paymentRepository.findByBookingId(request.getBookingId()).isPresent()) {
            log.warn("Payment already exists for booking: {}", request.getBookingId());
            throw new RuntimeException("Payment already exists for this booking");
        }

        // Create payment record in PENDING status
        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(userId)
                .eventId(request.getEventId())  // ADD THIS LINE
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(PaymentStatus.PENDING)
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()))
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment record created with ID: {}", payment.getId());

        // Create Razorpay order
        Map<String, String> notes = new HashMap<>();
        notes.put("bookingId", String.valueOf(payment.getBookingId()));
        notes.put("userId", String.valueOf(userId));
        notes.put("eventId", String.valueOf(payment.getEventId()));  // ADD THIS LINE

        RazorpayOrderRequest orderRequest = RazorpayOrderRequest.builder()
                .amount(payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
                .currency(payment.getCurrency())
                .receipt("receipt_" + payment.getId())
                .notes(notes)
                .build();

        try {
            RazorpayOrderResponse orderResponse = razorpayClient.createOrder(orderRequest);

            payment.setGatewayTxnId(orderResponse.getId());
            payment = paymentRepository.save(payment);

            log.info("Razorpay order created. Order ID: {}", orderResponse.getId());

            return mapToResponse(payment, orderResponse.getId());
        } catch (IOException e) {
            log.error("Error creating Razorpay order", e);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw e;
        }
    }


    /**
     * Verify and process payment after Razorpay webhook
     */
    public PaymentResponse verifyAndProcessPayment(String orderId, String paymentId, String signature) {
        log.info("Verifying payment for order: {}, payment: {}", orderId, paymentId);

        // Verify signature
        if (!razorpayClient.verifyPaymentSignature(orderId, paymentId, signature)) {
            log.error("Payment signature verification failed!");
            throw new RuntimeException("Invalid payment signature");
        }

        // Find payment by gateway transaction ID (Razorpay order ID)
        Payment payment = paymentRepository.findByGatewayTxnId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        // Mark as success
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentTime(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        log.info("Payment verified and marked as SUCCESS. Payment ID: {}", payment.getId());

        // Emit Kafka event
        PaymentMessage message = PaymentMessage.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .eventId(payment.getEventId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().toString())
                .gatewayTxnId(payment.getGatewayTxnId())
                .paymentTime(payment.getPaymentTime())
                .build();

        kafkaProducerService.sendPaymentSuccess(message);

        return mapToResponse(payment, orderId);
    }

    /**
     * Handle failed payment
     */
    public PaymentResponse handleFailedPayment(String orderId, String reason) {
        log.warn("Payment failed for order: {}, reason: {}", orderId, reason);

        Payment payment = paymentRepository.findByGatewayTxnId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setStatus(PaymentStatus.FAILED);
        payment.setPaymentTime(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        // Emit Kafka event
        PaymentMessage message = PaymentMessage.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .eventId(payment.getEventId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().toString())
                .failureReason(reason)
                .build();

        kafkaProducerService.sendPaymentFailed(message);

        return mapToResponse(payment, orderId);
    }

    /**
     * Get payment by ID
     */
    public PaymentResponse getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
        return mapToResponse(payment, payment.getGatewayTxnId());
    }

    /**
     * Get payment by booking ID
     */
    public PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking: " + bookingId));
        return mapToResponse(payment, payment.getGatewayTxnId());
    }

    /**
     * Get all payments for a user
     */
    public Page<PaymentResponse> getUserPayments(Long userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable)
                .map(payment -> mapToResponse(payment, payment.getGatewayTxnId()));
    }

    /**
     * Refund payment
     */
    public PaymentResponse refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new RuntimeException("Can only refund successful payments");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment = paymentRepository.save(payment);

        log.info("Payment refunded. Payment ID: {}", paymentId);

        // Emit Kafka event
        PaymentMessage message = PaymentMessage.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .eventId(payment.getEventId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().toString())
                .build();

        kafkaProducerService.sendPaymentRefund(message);

        return mapToResponse(payment, payment.getGatewayTxnId());
    }

    /**
     * Map Payment entity to Response DTO
     */
    private PaymentResponse mapToResponse(Payment payment, String razorpayOrderId) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .eventId(payment.getEventId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().toString())
                .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().toString() : null)
                .gatewayTxnId(payment.getGatewayTxnId())
                .paymentTime(payment.getPaymentTime())
                .createdAt(payment.getCreatedAt())
                .razorpayOrderId(razorpayOrderId)
                .build();
    }
}
