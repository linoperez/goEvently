package com.goevently.notificationservice.service;

import com.goevently.notificationservice.dto.BookingEvent;
import com.goevently.notificationservice.dto.PaymentEvent;
import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
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
    public void handleBookingConfirmed(BookingEvent event) {
        log.info("Received booking-confirmed for bookingId={}, userId={}", event.getId(), event.getUserId());

        notificationService.createNotification(
                event.getUserId(),
                event.getEventId(),
                NotificationType.IN_APP,
                "Booking Confirmed",
                "Your booking #" + event.getId() + " has been confirmed.",
                null,
                NotificationStatus.SENT
        );
    }

    @KafkaListener(
            topics = "payment-success",
            groupId = "notification-payment-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    public void handlePaymentSuccess(PaymentEvent event) {
        log.info("Received payment-success for bookingId={}, userId={}", event.getBookingId(), event.getUserId());

        notificationService.createNotification(
                event.getUserId(),
                event.getEventId(),
                NotificationType.IN_APP,
                "Payment Successful",
                "Payment successful for booking #" + event.getBookingId() + ".",
                null,
                NotificationStatus.SENT
        );
    }

    @KafkaListener(
            topics = "payment-failed",
            groupId = "notification-payment-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(PaymentEvent event) {
        log.info("Received payment-failed for bookingId={}, userId={}", event.getBookingId(), event.getUserId());

        notificationService.createNotification(
                event.getUserId(),
                event.getEventId(),
                NotificationType.IN_APP,
                "Payment Failed",
                "Payment failed for booking #" + event.getBookingId()
                        + (event.getReason() != null ? ". Reason: " + event.getReason() : "."),
                null,
                NotificationStatus.SENT
        );
    }
}