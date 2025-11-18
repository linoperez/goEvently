package com.goevently.bookingservice.service;

import com.goevently.bookingservice.dto.BookingMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, BookingMessage> kafkaTemplate;

    public void sendBookingCreated(BookingMessage booking) {
        log.info("Sending booking-created message to Kafka: {}", booking);
        kafkaTemplate.send("booking-created", String.valueOf(booking.getId()), booking);
    }

    public void sendBookingConfirmed(BookingMessage booking) {
        log.info("Sending booking-confirmed message to Kafka: {}", booking);
        kafkaTemplate.send("booking-confirmed", String.valueOf(booking.getId()), booking);
    }

    public void sendBookingCancelled(BookingMessage booking) {
        log.info("Sending booking-cancelled message to Kafka: {}", booking);
        kafkaTemplate.send("booking-cancelled", String.valueOf(booking.getId()), booking);
    }
}
