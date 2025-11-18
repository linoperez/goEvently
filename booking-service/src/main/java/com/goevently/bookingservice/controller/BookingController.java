package com.goevently.bookingservice.controller;

import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.BookingRequest;
import com.goevently.bookingservice.dto.BookingResponse;
import com.goevently.bookingservice.exception.InvalidTokenException;
import com.goevently.bookingservice.service.BookingService;
import com.goevently.bookingservice.util.JwtTokenUtil;
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

@RestController
@RequestMapping("/api/bookings")
@Slf4j
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    /**
     * Create a new booking
     * POST /api/bookings
     *
     * Flow:
     * 1. Extract JWT from Authorization header
     * 2. Validate JWT signature
     * 3. Extract userId from JWT claims
     * 4. Create booking for that user
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        log.info("Received booking request for event: {}", request.getEventId());

        // Step 1: Extract token from header
        String token = jwtTokenUtil.extractTokenFromHeader(authHeader);
        if (token == null) {
            log.error("Missing or invalid Authorization header");
            throw new InvalidTokenException("Missing or invalid Authorization header");
        }

        // Step 2: Validate and parse token
        Claims claims = jwtTokenUtil.validateAndParseToken(token);

        // Step 3: Extract userId from claims
        Long userId = jwtTokenUtil.getUserIdFromClaims(claims);
        log.info("Creating booking for user: {} for event: {}", userId, request.getEventId());

        // Step 4: Create booking
        BookingResponse booking = bookingService.createBooking(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<BookingResponse>builder()
                        .success(true)
                        .message("Booking created successfully")
                        .data(booking)
                        .build());
    }

    /**
     * Get booking by ID
     */
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
     * Get all bookings for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getUserBookings(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        log.info("Fetching bookings for user: {}", userId);

        // Validate token
        String token = jwtTokenUtil.extractTokenFromHeader(authHeader);
        if (token == null) {
            throw new InvalidTokenException("Missing or invalid Authorization header");
        }
        Claims claims = jwtTokenUtil.validateAndParseToken(token);
        Long requestingUserId = jwtTokenUtil.getUserIdFromClaims(claims);

        // Security: Users can only view their own bookings (or admin can view all)
        // For now, we'll just log it
        log.info("User {} requesting bookings for user {}", requestingUserId, userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> bookings = bookingService.getUserBookings(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message("User bookings retrieved successfully")
                .data(bookings)
                .build());
    }

    /**
     * Get all bookings for an event
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getEventBookings(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Fetching bookings for event: {}", eventId);

        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> bookings = bookingService.getEventBookings(eventId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message("Event bookings retrieved successfully")
                .data(bookings)
                .build());
    }

    /**
     * Confirm a booking (after payment success)
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(
            @PathVariable Long id,
            @RequestParam String paymentId) {
        log.info("Confirming booking: {} with payment ID: {}", id, paymentId);

        BookingResponse booking = bookingService.confirmBooking(id, paymentId);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .success(true)
                .message("Booking confirmed successfully")
                .data(booking)
                .build());
    }

    /**
     * Cancel a booking
     */
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

    /**
     * Mark booking as failed
     */
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
