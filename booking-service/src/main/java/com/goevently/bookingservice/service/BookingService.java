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
import com.goevently.bookingservice.client.EventServiceClient;
import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.TicketTierDto;
import com.goevently.bookingservice.dto.TierLock;
import java.math.BigDecimal;
import java.util.UUID;

import java.time.LocalDateTime;

@Service
@Slf4j
@Transactional
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private EventServiceClient eventServiceClient;

    @Autowired
    private LockService lockService;

    /**
     * Phase 1 Step 1: Create a new booking using (eventId + ticketTierId + quantity).
     * Auth is centralized at Gateway, so we receive userId from headers in controller.
     */
    public BookingResponse createBooking(Long userId, BookingRequest request) {

        int quantity = request.resolvedQuantity();

        // 0) Validate quantity
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        // 1) Validate lock
        TierLock lock = lockService.getLock(request.getLockId());

        if (lock == null) {
            throw new RuntimeException("Lock not found or expired");
        }

        if (lock.getUserId() == null || !lock.getUserId().equals(userId)) {
            throw new RuntimeException("Lock does not belong to this user");
        }

        if (lock.getEventId() == null || !lock.getEventId().equals(request.getEventId())) {
            throw new RuntimeException("Lock event does not match booking request");
        }

        if (lock.getTicketTierId() == null || !lock.getTicketTierId().equals(request.getTicketTierId())) {
            throw new RuntimeException("Lock ticket tier does not match booking request");
        }

        if (lock.getQuantity() == null || lock.getQuantity() != quantity) {
            throw new RuntimeException("Lock quantity does not match booking request");
        }

        // 2) Fetch ticket tier from event-service
        ApiResponse<TicketTierDto> tierResp = eventServiceClient.getTicketTierById(request.getTicketTierId());

        if (tierResp == null || !Boolean.TRUE.equals(tierResp.getSuccess()) || tierResp.getData() == null) {
            throw new RuntimeException("Invalid ticket tier ID: " + request.getTicketTierId());
        }

        TicketTierDto tier = tierResp.getData();

        // 3) Validate tier belongs to the event
        if (tier.getEventId() == null || !tier.getEventId().equals(request.getEventId())) {
            throw new RuntimeException("Ticket tier does not belong to eventId=" + request.getEventId());
        }

        // 4) Compute total (server-side)
        if (tier.getPrice() == null) {
            throw new RuntimeException("Ticket tier price missing");
        }

        BigDecimal totalAmount = tier.getPrice().multiply(BigDecimal.valueOf(quantity));

        // 5) Create booking in PENDING_PAYMENT
        Booking booking = Booking.builder()
                .userId(userId)
                .eventId(request.getEventId())
                .ticketTierId(request.getTicketTierId())
                .lockId(request.getLockId())
                .seats(quantity)
                .status(BookingStatus.PENDING_PAYMENT.toString())
                .bookingTime(LocalDateTime.now())
                .txnRef(UUID.randomUUID().toString())
                .totalAmount(totalAmount)
                .currency("INR")
                .build();

        Booking saved = bookingRepository.save(booking);

        // 6) Publish booking-created
        BookingMessage message = BookingMessage.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .eventId(saved.getEventId())
                .ticketTierId(saved.getTicketTierId())
                .quantity(saved.getSeats())
                .lockId(saved.getLockId())
                .seats(saved.getSeats())
                .status(saved.getStatus())
                .totalAmount(saved.getTotalAmount())
                .currency(saved.getCurrency())
                .bookingTime(saved.getBookingTime())
                .build();

        kafkaProducerService.sendBookingCreated(message);

        return mapToResponse(saved);
    }

    public BookingResponse getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));
        return mapToResponse(booking);
    }

    public Page<BookingResponse> getUserBookings(Long userId, Pageable pageable) {
        log.info("Fetching bookings for user: {}", userId);
        return bookingRepository.findByUserId(userId, pageable).map(this::mapToResponse);
    }

    public Page<BookingResponse> getEventBookings(Long eventId, Pageable pageable) {
        log.info("Fetching bookings for event: {}", eventId);
        return bookingRepository.findByEventId(eventId, pageable).map(this::mapToResponse);
    }

    public BookingResponse confirmBooking(Long bookingId, String paymentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (!BookingStatus.PENDING_PAYMENT.toString().equals(booking.getStatus())) {
            log.warn("Ignoring confirmBooking for bookingId={} because status={}",
                    bookingId, booking.getStatus());
            return mapToResponse(booking);
        }

        booking.setStatus(BookingStatus.CONFIRMED.toString());
        booking.setPaymentId(paymentId);

        Booking updatedBooking = bookingRepository.save(booking);

        if (updatedBooking.getLockId() != null && !updatedBooking.getLockId().isBlank()) {
            lockService.deleteLockOnly(updatedBooking.getLockId());
        }

        BookingMessage message = BookingMessage.builder()
                .id(updatedBooking.getId())
                .userId(updatedBooking.getUserId())
                .eventId(updatedBooking.getEventId())
                .ticketTierId(updatedBooking.getTicketTierId())
                .quantity(updatedBooking.getSeats())
                .lockId(updatedBooking.getLockId())
                .seats(updatedBooking.getSeats())
                .status(updatedBooking.getStatus())
                .paymentId(updatedBooking.getPaymentId())
                .totalAmount(updatedBooking.getTotalAmount())
                .currency(updatedBooking.getCurrency())
                .bookingTime(updatedBooking.getBookingTime())
                .build();

        kafkaProducerService.sendBookingConfirmed(message);

        return mapToResponse(updatedBooking);
    }

    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        booking.setStatus(BookingStatus.CANCELLED.toString());
        Booking updatedBooking = bookingRepository.save(booking);

        BookingMessage message = BookingMessage.builder()
                .id(updatedBooking.getId())
                .userId(updatedBooking.getUserId())
                .eventId(updatedBooking.getEventId())
                .ticketTierId(updatedBooking.getTicketTierId())
                .quantity(updatedBooking.getSeats())
                .seats(updatedBooking.getSeats())
                .status(updatedBooking.getStatus())
                .bookingTime(updatedBooking.getBookingTime())
                .build();

        kafkaProducerService.sendBookingCancelled(message);

        return mapToResponse(updatedBooking);
    }

    public BookingResponse failBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (!BookingStatus.PENDING_PAYMENT.toString().equals(booking.getStatus())) {
            log.warn("Ignoring failBooking for bookingId={} because status={}",
                    bookingId, booking.getStatus());
            return mapToResponse(booking);
        }

        booking.setStatus(BookingStatus.FAILED.toString());
        Booking updatedBooking = bookingRepository.save(booking);

        if (updatedBooking.getLockId() != null && !updatedBooking.getLockId().isBlank()) {
            lockService.releaseLock(updatedBooking.getLockId());
        }

        return mapToResponse(updatedBooking);
    }

    public BookingResponse expireBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (BookingStatus.EXPIRED.toString().equals(booking.getStatus())) {
            return mapToResponse(booking);
        }

        if (BookingStatus.CONFIRMED.toString().equals(booking.getStatus())) {
            throw new RuntimeException("Cannot expire a confirmed booking");
        }

        if (BookingStatus.FAILED.toString().equals(booking.getStatus())
                || BookingStatus.CANCELLED.toString().equals(booking.getStatus())) {
            return mapToResponse(booking);
        }

        booking.setStatus(BookingStatus.EXPIRED.toString());
        Booking updatedBooking = bookingRepository.save(booking);

        if (updatedBooking.getLockId() != null && !updatedBooking.getLockId().isBlank()) {
            lockService.releaseLock(updatedBooking.getLockId());
        }

        return mapToResponse(updatedBooking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .eventId(booking.getEventId())
                .ticketTierId(booking.getTicketTierId())
                .quantity(booking.getSeats())
                .lockId(booking.getLockId())
                .status(booking.getStatus())
                .paymentId(booking.getPaymentId())
                .txnRef(booking.getTxnRef())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .bookingTime(booking.getBookingTime())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}