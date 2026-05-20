package com.goevently.bookingservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DltConsumerService {

    @KafkaListener(topics = "payment-success-dlt", groupId = "booking-service-dlt-group")
    public void handlePaymentSuccessDlt(String payload) {
        log.error("Received message in payment-success-dlt: {}", payload);
    }

    @KafkaListener(topics = "payment-failed-dlt", groupId = "booking-service-dlt-group")
    public void handlePaymentFailedDlt(String payload) {
        log.error("Received message in payment-failed-dlt: {}", payload);
    }

    @KafkaListener(topics = "booking-confirmed-dlt", groupId = "booking-service-dlt-group")
    public void handleBookingConfirmedDlt(String payload) {
        log.error("Received message in booking-confirmed-dlt: {}", payload);
    }

    @KafkaListener(topics = "booking-created-dlt", groupId = "booking-service-dlt-group")
    public void handleBookingCreatedDlt(String payload) {
        log.error("Received message in booking-created-dlt: {}", payload);
    }
}