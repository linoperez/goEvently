package com.goevently.bookingservice.service;

import com.goevently.bookingservice.dto.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
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
    public void handlePaymentSuccess(
            PaymentEvent event,
            @Header(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        if (correlationId != null) {
            MDC.put("correlationId", correlationId);
        }

        try {
            log.info("Received payment-success event: bookingId={}, paymentId={}, status={}, correlationId={}",
                    event.getBookingId(), event.getPaymentId(), event.getStatus(), correlationId);

            if (event.getBookingId() == null) {
                log.warn("Ignoring payment-success because bookingId is null");
                return;
            }

            bookingService.confirmBooking(event.getBookingId(), event.getPaymentId());
        } finally {
            MDC.clear();
        }
    }

    @KafkaListener(
            topics = "payment-failed",
            groupId = "booking-service-payment-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(
            PaymentEvent event,
            @Header(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        if (correlationId != null) {
            MDC.put("correlationId", correlationId);
        }

        try {
            log.info("Received payment-failed event: bookingId={}, status={}, correlationId={}",
                    event.getBookingId(), event.getStatus(), correlationId);

            if (event.getBookingId() == null) {
                log.warn("Ignoring payment-failed because bookingId is null");
                return;
            }

            bookingService.failBooking(event.getBookingId());
        } finally {
            MDC.clear();
        }
    }
}