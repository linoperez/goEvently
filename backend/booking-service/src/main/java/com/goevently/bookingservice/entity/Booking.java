package com.goevently.bookingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "username")
    private String username;

    @Column(nullable = false)
    private Long eventId;


    @Column(name = "ticket_tier_id")
    private Long ticketTierId;

    @Column(nullable = false)
    private String status;

    @Column(name = "booking_time")
    private LocalDateTime bookingTime;

    @Column(name = "lock_id")
    private String lockId;

    @Column(name = "payment_id")
    private String paymentId;

    /**
     * Existing column.
     * For Phase 1, this is quantity.
     */
    @Column(nullable = false)
    private Integer seats;

    @Column(name = "txn_ref")
    private String txnRef;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false)
    private String currency;
}