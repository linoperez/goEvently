package com.goevently.bookingservice.controller;

import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.LockRequest;
import com.goevently.bookingservice.dto.LockResponse;
import com.goevently.bookingservice.dto.TierLock;
import com.goevently.bookingservice.service.LockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/locks")
@Slf4j
@RequiredArgsConstructor
public class LockController {

    private final LockService lockService;

    @PostMapping
    public ResponseEntity<ApiResponse<LockResponse>> createLock(
            @Valid @RequestBody LockRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role
    ) {
        log.info("Creating lock for userId={} role={} eventId={} tierId={} qty={}",
                userId, role, request.getEventId(), request.getTicketTierId(), request.getQuantity());

        LockResponse lock = lockService.createLock(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<LockResponse>builder()
                        .success(true)
                        .message("Lock created successfully")
                        .data(lock)
                        .build());
    }

    @GetMapping("/{lockId}")
    public ResponseEntity<ApiResponse<LockResponse>> getLock(
            @PathVariable String lockId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role
    ) {
        TierLock lock = lockService.getLock(lockId);

        if (lock == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<LockResponse>builder()
                            .success(false)
                            .message("Lock not found or expired")
                            .build());
        }

        if (!"ADMIN".equalsIgnoreCase(role) && !userId.equals(lock.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<LockResponse>builder()
                            .success(false)
                            .message("You can only view your own locks")
                            .build());
        }

        LockResponse response = LockResponse.builder()
                .lockId(lock.getLockId())
                .userId(lock.getUserId())
                .eventId(lock.getEventId())
                .ticketTierId(lock.getTicketTierId())
                .quantity(lock.getQuantity())
                .createdAt(lock.getCreatedAt())
                .expiresAt(lock.getExpiresAt())
                .status(lock.getStatus())
                .build();

        return ResponseEntity.ok(ApiResponse.<LockResponse>builder()
                .success(true)
                .message("Lock retrieved successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{lockId}")
    public ResponseEntity<ApiResponse<Void>> releaseLock(
            @PathVariable String lockId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role
    ) {
        TierLock lock = lockService.getLock(lockId);

        if (lock == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("Lock not found or already expired")
                            .build());
        }

        if (!"ADMIN".equalsIgnoreCase(role) && !userId.equals(lock.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("You can only release your own locks")
                            .build());
        }

        lockService.releaseLock(lockId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Lock released successfully")
                .build());
    }
}