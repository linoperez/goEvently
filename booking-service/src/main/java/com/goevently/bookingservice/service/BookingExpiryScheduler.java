package com.goevently.bookingservice.service;

import com.goevently.bookingservice.entity.Booking;
import com.goevently.bookingservice.entity.BookingStatus;
import com.goevently.bookingservice.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    @Value("${app.booking.payment-timeout-minutes:15}")
    private long paymentTimeoutMinutes;

    @Scheduled(fixedDelayString = "${app.booking.cleanup-interval-ms:60000}")
    public void expirePendingPaymentBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(paymentTimeoutMinutes);

        List<Booking> staleBookings = bookingRepository.findByStatusAndBookingTimeBefore(
                BookingStatus.PENDING_PAYMENT.toString(),
                cutoff
        );

        if (staleBookings.isEmpty()) {
            return;
        }

        log.info("Found {} stale PENDING_PAYMENT bookings to expire", staleBookings.size());

        for (Booking booking : staleBookings) {
            try {
                bookingService.expireBooking(booking.getId());
                log.info("Expired stale booking bookingId={}", booking.getId());
            } catch (Exception e) {
                log.error("Failed to expire booking bookingId={}", booking.getId(), e);
            }
        }
    }
}