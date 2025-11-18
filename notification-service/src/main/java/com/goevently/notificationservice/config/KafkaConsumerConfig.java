package com.goevently.notificationservice.config;

import com.goevently.notificationservice.dto.EventMessage;
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
    public ConsumerFactory<String, EventMessage> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, 1000);

        // Create JsonDeserializer for EventMessage
        JsonDeserializer<EventMessage> jsonDeserializer = new JsonDeserializer<>(EventMessage.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setRemoveTypeHeaders(false);
        jsonDeserializer.setUseTypeHeaders(false);  // ← CORRECTED METHOD NAME

        // Wrap deserializers with ErrorHandlingDeserializer
        ErrorHandlingDeserializer<String> keyDeserializer =
                new ErrorHandlingDeserializer<>(new StringDeserializer());
        ErrorHandlingDeserializer<EventMessage> valueDeserializer =
                new ErrorHandlingDeserializer<>(jsonDeserializer);

        return new DefaultKafkaConsumerFactory<>(props, keyDeserializer, valueDeserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventMessage> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EventMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setPollTimeout(1000);

        // Add error handler for deserialization errors
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(0, 0)));

        return factory;
    }
}
