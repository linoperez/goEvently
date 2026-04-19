package com.goevently.notificationservice.service;

import com.goevently.notificationservice.dto.BookingEvent;
import com.goevently.notificationservice.dto.PaymentEvent;
import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
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

    private final NotificationService notificationService;

    @KafkaListener(
            topics = "booking-confirmed",
            groupId = "notification-booking-group",
            containerFactory = "bookingKafkaListenerContainerFactory"
    )
    public void handleBookingConfirmed(
            BookingEvent event,
            @Header(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        if (correlationId != null) {
            MDC.put("correlationId", correlationId);
        }

        try {
            log.info("Received booking-confirmed event: bookingId={}, userId={}, correlationId={}",
                    event.getId(), event.getUserId(), correlationId);

            String title = "Booking Confirmed";
            String message = "Your booking has been confirmed successfully. Booking ID: " + event.getId();

            notificationService.createNotification(
                    event.getUserId(),
                    event.getEventId(),
                    NotificationType.IN_APP,
                    title,
                    message,
                    null,
                    NotificationStatus.SENT
            );

        } catch (Exception e) {
            log.error("Error processing booking-confirmed event", e);
            throw e; // required for retry + DLT
        } finally {
            MDC.clear();
        }
    }

    @KafkaListener(
            topics = "payment-success",
            groupId = "notification-payment-group",
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
            log.info("Received payment-success event: bookingId={}, paymentId={}, correlationId={}",
                    event.getBookingId(), event.getPaymentId(), correlationId);

            String title = "Payment Successful";
            String message = "Payment completed successfully for booking ID: " + event.getBookingId();

            notificationService.createNotification(
                    event.getUserId(),
                    event.getEventId(),
                    NotificationType.IN_APP,
                    title,
                    message,
                    null,
                    NotificationStatus.SENT
            );

        } catch (Exception e) {
            log.error("Error processing payment-success event", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    @KafkaListener(
            topics = "payment-failed",
            groupId = "notification-payment-group",
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

            String title = "Payment Failed";
            String message = "Payment failed for booking ID: " + event.getBookingId();

            notificationService.createNotification(
                    event.getUserId(),
                    event.getEventId(),
                    NotificationType.IN_APP,
                    title,
                    message,
                    null,
                    NotificationStatus.SENT
            );

        } catch (Exception e) {
            log.error("Error processing payment-failed event", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}