package com.goevently.notificationservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DltConsumerService {

    @KafkaListener(topics = "booking-confirmed-dlt", groupId = "notification-dlt-group")
    public void handleBookingConfirmedDlt(String payload) {
        log.error("Received message in booking-confirmed-dlt: {}", payload);
    }

    @KafkaListener(topics = "payment-success-dlt", groupId = "notification-dlt-group")
    public void handlePaymentSuccessDlt(String payload) {
        log.error("Received message in payment-success-dlt: {}", payload);
    }

    @KafkaListener(topics = "payment-failed-dlt", groupId = "notification-dlt-group")
    public void handlePaymentFailedDlt(String payload) {
        log.error("Received message in payment-failed-dlt: {}", payload);
    }

    @KafkaListener(topics = "event-created-dlt", groupId = "notification-dlt-group")
    public void handleEventCreatedDlt(String payload) {
        log.error("Received message in event-created-dlt: {}", payload);
    }

    @KafkaListener(topics = "event-updated-dlt", groupId = "notification-dlt-group")
    public void handleEventUpdatedDlt(String payload) {
        log.error("Received message in event-updated-dlt: {}", payload);
    }

    @KafkaListener(topics = "event-deleted-dlt", groupId = "notification-dlt-group")
    public void handleEventDeletedDlt(String payload) {
        log.error("Received message in event-deleted-dlt: {}", payload);
    }
}