package com.goevently.notificationservice.config;

import com.goevently.notificationservice.dto.BookingEvent;
import com.goevently.notificationservice.dto.EventMessage;
import com.goevently.notificationservice.dto.PaymentEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @Bean
    public ConsumerFactory<String, EventMessage> eventConsumerFactory() {
        JsonDeserializer<EventMessage> jsonDeserializer = new JsonDeserializer<>(EventMessage.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setRemoveTypeHeaders(false);
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                commonConsumerProps(groupId),
                new ErrorHandlingDeserializer<>(new StringDeserializer()),
                new ErrorHandlingDeserializer<>(jsonDeserializer)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventMessage> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EventMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(eventConsumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setPollTimeout(1000);
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(0, 0)));
        return factory;
    }

    @Bean
    public ConsumerFactory<String, BookingEvent> bookingConsumerFactory() {
        JsonDeserializer<BookingEvent> jsonDeserializer = new JsonDeserializer<>(BookingEvent.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setRemoveTypeHeaders(false);
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                commonConsumerProps("notification-booking-group"),
                new ErrorHandlingDeserializer<>(new StringDeserializer()),
                new ErrorHandlingDeserializer<>(jsonDeserializer)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, BookingEvent> bookingKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, BookingEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(bookingConsumerFactory());
        factory.setConcurrency(1);
        factory.getContainerProperties().setPollTimeout(1000);
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(0, 0)));
        return factory;
    }

    @Bean
    public ConsumerFactory<String, PaymentEvent> paymentConsumerFactory() {
        JsonDeserializer<PaymentEvent> jsonDeserializer = new JsonDeserializer<>(PaymentEvent.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setRemoveTypeHeaders(false);
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                commonConsumerProps("notification-payment-group"),
                new ErrorHandlingDeserializer<>(new StringDeserializer()),
                new ErrorHandlingDeserializer<>(jsonDeserializer)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> paymentKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentConsumerFactory());
        factory.setConcurrency(1);
        factory.getContainerProperties().setPollTimeout(1000);
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(0, 0)));
        return factory;
    }

    private Map<String, Object> commonConsumerProps(String groupIdValue) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupIdValue);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, 1000);
        return props;
    }
}