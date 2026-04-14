package com.goevently.bookingservice.service;

import com.goevently.bookingservice.dto.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final BookingService bookingService;

    @KafkaListener(
            topics = "payment-success",
            groupId = "booking-service-payment-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    public void handlePaymentSuccess(PaymentEvent event) {
        log.info("Received payment-success event: bookingId={}, paymentId={}",
                event.getBookingId(), event.getPaymentId());

        if (event.getBookingId() == null) {
            log.warn("Ignoring payment-success because bookingId is null");
            return;
        }

        bookingService.confirmBooking(event.getBookingId(), event.getPaymentId());
    }

    @KafkaListener(
            topics = "payment-failed",
            groupId = "booking-service-payment-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(PaymentEvent event) {
        log.info("Received payment-failed event: bookingId={}, paymentId={}",
                event.getBookingId(), event.getPaymentId());

        if (event.getBookingId() == null) {
            log.warn("Ignoring payment-failed because bookingId is null");
            return;
        }

        bookingService.failBooking(event.getBookingId());
    }
}