package com.goevently.bookingservice.service;

import com.goevently.bookingservice.dto.BookingMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, BookingMessage> kafkaTemplate;

    public void sendBookingCreated(BookingMessage booking) {
        sendWithCorrelation("booking-created", booking);
    }

    public void sendBookingConfirmed(BookingMessage booking) {
        sendWithCorrelation("booking-confirmed", booking);
    }

    public void sendBookingCancelled(BookingMessage booking) {
        sendWithCorrelation("booking-cancelled", booking);
    }

    private void sendWithCorrelation(String topic, BookingMessage payload) {
        String correlationId = MDC.get("correlationId");

        Message<BookingMessage> message = MessageBuilder
                .withPayload(payload)
                .setHeader(KafkaHeaders.TOPIC, topic)
                .setHeader(KafkaHeaders.KEY, String.valueOf(payload.getId()))
                .setHeader("X-Correlation-Id", correlationId)
                .build();

        log.info("Sending {} message to Kafka bookingId={} correlationId={}",
                topic, payload.getId(), correlationId);

        kafkaTemplate.send(message);
    }
}