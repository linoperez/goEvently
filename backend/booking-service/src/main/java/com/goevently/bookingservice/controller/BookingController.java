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
import org.springframework.data.domain.Sort;

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

        BookingResponse booking = bookingService.createBooking(userId, username, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<BookingResponse>builder()
                        .success(true)
                        .message("Booking created successfully")
                        .data(booking)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role
    ) {
        BookingResponse booking = bookingService.getBooking(id);

        if (!"ADMIN".equalsIgnoreCase(role) && !booking.getUserId().equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<BookingResponse>builder()
                            .success(false)
                            .message("You can only view your own booking")
                            .build());
        }

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking retrieved successfully")
                .data(booking)
                .build());
    }

    @GetMapping("/internal/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingInternal(@PathVariable Long id) {
        log.info("Internal fetch for booking with ID: {}", id);

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

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
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
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader("X-User-Role") String role
    ) {

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Page<BookingResponse>>builder()
                            .success(false)
                            .message("Only admin can view event bookings")
                            .build());
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

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
            @RequestParam String paymentId,
            @RequestHeader("X-User-Role") String role
    ) {
        log.info("Confirming booking: {} with payment ID: {} by role: {}", id, paymentId, role);

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<BookingResponse>builder()
                            .success(false)
                            .message("Only admin can confirm bookings")
                            .build());
        }

        BookingResponse booking = bookingService.confirmBooking(id, paymentId);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking confirmed successfully")
                .data(booking)
                .build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role
    ) {
        log.info("Cancelling booking: {} by role: {}", id, role);

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<BookingResponse>builder()
                            .success(false)
                            .message("Only admin can cancel bookings")
                            .build());
        }

        BookingResponse booking = bookingService.cancelBooking(id);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking cancelled successfully")
                .data(booking)
                .build());
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<ApiResponse<BookingResponse>> failBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role
    ) {
        log.info("Marking booking as failed: {} by role: {}", id, role);

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<BookingResponse>builder()
                            .success(false)
                            .message("Only admin can mark booking as failed")
                            .build());
        }

        BookingResponse booking = bookingService.failBooking(id);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking marked as failed")
                .data(booking)
                .build());
    }

}