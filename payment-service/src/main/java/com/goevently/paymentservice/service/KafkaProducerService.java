package com.goevently.paymentservice.service;

import com.goevently.paymentservice.dto.PaymentMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, PaymentMessage> kafkaTemplate;

    public void sendPaymentSuccess(PaymentMessage payment) {
        log.info("Sending payment-success message to Kafka: {}", payment.getId());
        kafkaTemplate.send("payment-success", String.valueOf(payment.getId()), payment);
    }

    public void sendPaymentFailed(PaymentMessage payment) {
        log.info("Sending payment-failed message to Kafka: {}", payment.getId());
        kafkaTemplate.send("payment-failed", String.valueOf(payment.getId()), payment);
    }

    public void sendPaymentRefund(PaymentMessage payment) {
        log.info("Sending payment-refund message to Kafka: {}", payment.getId());
        kafkaTemplate.send("payment-refund", String.valueOf(payment.getId()), payment);
    }
}
