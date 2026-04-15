package com.goevently.bookingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "lock_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LockRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lock_id", nullable = false, unique = true)
    private String lockId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long eventId;

    @Column(name = "ticket_tier_id", nullable = false)
    private Long ticketTierId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String status; // ACTIVE, COMPLETED, EXPIRED, RELEASED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;
}