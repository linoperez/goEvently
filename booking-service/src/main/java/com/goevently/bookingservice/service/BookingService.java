package com.goevently.bookingservice.service;

import com.goevently.bookingservice.dto.BookingMessage;
import com.goevently.bookingservice.dto.BookingRequest;
import com.goevently.bookingservice.dto.BookingResponse;
import com.goevently.bookingservice.entity.Booking;
import com.goevently.bookingservice.entity.BookingStatus;
import com.goevently.bookingservice.repository.BookingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
@Transactional
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    /**
     * Create a new booking
     */
    public BookingResponse createBooking(Long userId, BookingRequest request) {
        log.info("Creating booking for user: {} for event: {}", userId, request.getEventId());

        Booking booking = Booking.builder()
                .userId(userId)
                .eventId(request.getEventId())
                .seats(request.getSeats())
                .status(BookingStatus.PENDING.toString())
                .bookingTime(LocalDateTime.now())
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking created with ID: {}", savedBooking.getId());

        // Emit Kafka event
        BookingMessage message = BookingMessage.builder()
                .id(savedBooking.getId())
                .userId(savedBooking.getUserId())
                .eventId(savedBooking.getEventId())
                .status(savedBooking.getStatus())
                .seats(savedBooking.getSeats())
                .bookingTime(savedBooking.getBookingTime())
                .build();
        kafkaProducerService.sendBookingCreated(message);

        return mapToResponse(savedBooking);
    }

    /**
     * Get booking by ID
     */
    public BookingResponse getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));
        return mapToResponse(booking);
    }

    /**
     * Get all bookings for a user
     */
    public Page<BookingResponse> getUserBookings(Long userId, Pageable pageable) {
        log.info("Fetching bookings for user: {}", userId);
        return bookingRepository.findByUserId(userId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get all bookings for an event
     */
    public Page<BookingResponse> getEventBookings(Long eventId, Pageable pageable) {
        log.info("Fetching bookings for event: {}", eventId);
        return bookingRepository.findByEventId(eventId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Confirm booking (called after payment success)
     */
    public BookingResponse confirmBooking(Long bookingId, String paymentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        booking.setStatus(BookingStatus.CONFIRMED.toString());
        booking.setPaymentId(paymentId);

        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking {} confirmed with payment ID: {}", bookingId, paymentId);

        // Emit Kafka event
        BookingMessage message = BookingMessage.builder()
                .id(updatedBooking.getId())
                .userId(updatedBooking.getUserId())
                .eventId(updatedBooking.getEventId())
                .status(updatedBooking.getStatus())
                .seats(updatedBooking.getSeats())
                .paymentId(updatedBooking.getPaymentId())
                .bookingTime(updatedBooking.getBookingTime())
                .build();
        kafkaProducerService.sendBookingConfirmed(message);

        return mapToResponse(updatedBooking);
    }

    /**
     * Cancel booking
     */
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        booking.setStatus(BookingStatus.CANCELLED.toString());
        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking {} cancelled", bookingId);

        // Emit Kafka event
        BookingMessage message = BookingMessage.builder()
                .id(updatedBooking.getId())
                .userId(updatedBooking.getUserId())
                .eventId(updatedBooking.getEventId())
                .status(updatedBooking.getStatus())
                .seats(updatedBooking.getSeats())
                .bookingTime(updatedBooking.getBookingTime())
                .build();
        kafkaProducerService.sendBookingCancelled(message);

        return mapToResponse(updatedBooking);
    }

    /**
     * Mark booking as failed
     */
    public BookingResponse failBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        booking.setStatus(BookingStatus.FAILED.toString());
        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking {} marked as failed", bookingId);

        return mapToResponse(updatedBooking);
    }

    /**
     * Map Booking entity to Response DTO
     */
    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .eventId(booking.getEventId())
                .status(booking.getStatus())
                .seats(booking.getSeats())
                .paymentId(booking.getPaymentId())
                .txnRef(booking.getTxnRef())
                .bookingTime(booking.getBookingTime())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
