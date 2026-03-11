package com.goevently.bookingservice.controller;

import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.BookingRequest;
import com.goevently.bookingservice.dto.BookingResponse;
import com.goevently.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@Slf4j
public class BookingController {

    @Autowired
    private BookingService bookingService;

    /**
     * Create a new booking.
     * Auth is centralized at API Gateway.
     * Gateway injects identity headers: X-User-Id, X-User-Role, X-User-Username
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role,
            @RequestHeader(value = "X-User-Username", required = false) String username
    ) {
        log.info("Received booking request: userId={}, role={}, username={}, eventId={}, tierId={}, qty={}",
                userId, role, username, request.getEventId(), request.getTicketTierId(), request.resolvedQuantity());

        BookingResponse booking = bookingService.createBooking(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<BookingResponse>builder()
                        .success(true)
                        .message("Booking created successfully")
                        .data(booking)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable Long id) {
        log.info("Fetching booking with ID: {}", id);
        BookingResponse booking = bookingService.getBooking(id);
        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking retrieved successfully")
                .data(booking)
                .build());
    }

    /**
     * User can view their own bookings. Admin can view anyone's.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getUserBookings(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader("X-User-Id") Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role
    ) {
        log.info("Fetching bookings for userId={} requestedBy={} role={}", userId, requesterId, role);

        if (!"ADMIN".equalsIgnoreCase(role) && !requesterId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Page<BookingResponse>>builder()
                            .success(false)
                            .message("You can only view your own bookings")
                            .build());
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> bookings = bookingService.getUserBookings(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message("User bookings retrieved successfully")
                .data(bookings)
                .build());
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getEventBookings(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Fetching bookings for event: {}", eventId);
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> bookings = bookingService.getEventBookings(eventId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message("Event bookings retrieved successfully")
                .data(bookings)
                .build());
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(
            @PathVariable Long id,
            @RequestParam String paymentId
    ) {
        log.info("Confirming booking: {} with payment ID: {}", id, paymentId);
        BookingResponse booking = bookingService.confirmBooking(id, paymentId);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking confirmed successfully")
                .data(booking)
                .build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long id) {
        log.info("Cancelling booking: {}", id);
        BookingResponse booking = bookingService.cancelBooking(id);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking cancelled successfully")
                .data(booking)
                .build());
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<ApiResponse<BookingResponse>> failBooking(@PathVariable Long id) {
        log.info("Marking booking as failed: {}", id);
        BookingResponse booking = bookingService.failBooking(id);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking marked as failed")
                .data(booking)
                .build());
    }
}