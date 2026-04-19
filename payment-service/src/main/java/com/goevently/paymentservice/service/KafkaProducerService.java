package com.goevently.paymentservice.service;

import com.goevently.paymentservice.dto.PaymentMessage;
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

    private final KafkaTemplate<String, PaymentMessage> kafkaTemplate;

    public void sendPaymentSuccess(PaymentMessage payment) {
        sendWithCorrelation("payment-success", payment);
    }

    public void sendPaymentFailed(PaymentMessage payment) {
        sendWithCorrelation("payment-failed", payment);
    }

    public void sendPaymentRefund(PaymentMessage payment) {
        sendWithCorrelation("payment-refund", payment);
    }

    private void sendWithCorrelation(String topic, PaymentMessage payload) {
        String correlationId = MDC.get("correlationId");

        Message<PaymentMessage> message = MessageBuilder
                .withPayload(payload)
                .setHeader(KafkaHeaders.TOPIC, topic)
                .setHeader(KafkaHeaders.KEY, String.valueOf(payload.getId()))
                .setHeader("X-Correlation-Id", correlationId)
                .build();

        log.info("Sending {} message to Kafka paymentId={} correlationId={}",
                topic, payload.getId(), correlationId);

        kafkaTemplate.send(message);
    }
}