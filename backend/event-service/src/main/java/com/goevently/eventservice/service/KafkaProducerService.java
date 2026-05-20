package com.goevently.eventservice.service;

import com.goevently.eventservice.constants.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendEventCreated(Object eventPayload) {
        log.info("Sending event-created message to Kafka: {}", eventPayload);
        kafkaTemplate.send(KafkaTopics.EVENT_CREATED, eventPayload);
    }

    public void sendEventUpdated(Object eventPayload) {
        log.info("Sending event-updated message to Kafka: {}", eventPayload);
        kafkaTemplate.send(KafkaTopics.EVENT_UPDATED, eventPayload);
    }

    public void sendEventDeleted(Object eventPayload) {
        log.info("Sending event-deleted message to Kafka: {}", eventPayload);
        kafkaTemplate.send(KafkaTopics.EVENT_DELETED, eventPayload);
    }

    public void sendTicketTierCreated(Object tierPayload) {
        log.info("Sending ticket-tier-created message to Kafka: {}", tierPayload);
        kafkaTemplate.send(KafkaTopics.TICKET_TIER_CREATED, tierPayload);
    }
}
