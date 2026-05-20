package com.goevently.paymentservice.repository;

import com.goevently.paymentservice.entity.Payment;
import com.goevently.paymentservice.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Find payment by booking ID
    Optional<Payment> findByBookingId(Long bookingId);

    // Find payments by user ID with pagination
    Page<Payment> findByUserId(Long userId, Pageable pageable);

    // Find payments by event ID
    Page<Payment> findByEventId(Long eventId, Pageable pageable);

    // Find payments by status
    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    // Find payment by Razorpay order ID (stored in gatewayTxnId)
    Optional<Payment> findByGatewayTxnId(String gatewayTxnId);

    // Count successful payments for an event
    Long countByEventIdAndStatus(Long eventId, PaymentStatus status);
}
