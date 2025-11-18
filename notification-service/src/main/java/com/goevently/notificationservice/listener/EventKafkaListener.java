package com.goevently.notificationservice.listener;

import com.goevently.notificationservice.dto.EventMessage;
import com.goevently.notificationservice.entity.Notification;
import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
import com.goevently.notificationservice.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;

@Service
@Slf4j
public class EventKafkaListener {

    @Autowired
    private NotificationRepository notificationRepository;

    @PostConstruct
    public void init() {
        log.info("╔═══════════════════════════════════════════════════════════╗");
        log.info("║ 🎵 KAFKA LISTENER INITIALIZED                             ║");
        log.info("║ Listening to topics:                                      ║");
        log.info("║   - event-created                                         ║");
        log.info("║   - event-updated                                         ║");
        log.info("║   - event-deleted                                         ║");
        log.info("║ Consumer Group: notification-service-group                ║");
        log.info("╚═══════════════════════════════════════════════════════════╝");
    }

    @KafkaListener(topics = "event-created", groupId = "notification-service-group", containerFactory = "kafkaListenerContainerFactory")
    public void onEventCreated(EventMessage event) {
        log.info("╔═══════════════════════════════════════════════════════════╗");
        log.info("║ ✉️  KAFKA MESSAGE RECEIVED - event-created                 ║");
        log.info("║ Event ID: {} | Event Name: {}                             ║", event.getId(), event.getName());
        log.info("╚═══════════════════════════════════════════════════════════╝");

        try {
            Notification notification = Notification.builder()
                    .eventId(event.getId())
                    .userId(1L)
                    .notificationType(NotificationType.EMAIL)
                    .title("Event Created Successfully")
                    .message("Your event '" + event.getName() + "' has been created successfully!")
                    .recipient(event.getOrganizerUsername())
                    .status(NotificationStatus.SENT)
                    .sentAt(LocalDateTime.now())
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.info("✅ Notification saved to database. Notification ID: {}", saved.getId());

        } catch (Exception e) {
            log.error("❌ Error processing event-created message", e);
        }
    }

    @KafkaListener(topics = "event-updated", groupId = "notification-service-group", containerFactory = "kafkaListenerContainerFactory")
    public void onEventUpdated(EventMessage event) {
        log.info("╔═══════════════════════════════════════════════════════════╗");
        log.info("║ ✉️  KAFKA MESSAGE RECEIVED - event-updated                 ║");
        log.info("║ Event ID: {} | Event Name: {}                             ║", event.getId(), event.getName());
        log.info("╚═══════════════════════════════════════════════════════════╝");

        try {
            Notification notification = Notification.builder()
                    .eventId(event.getId())
                    .userId(1L)
                    .notificationType(NotificationType.EMAIL)
                    .title("Event Updated")
                    .message("The event '" + event.getName() + "' has been updated.")
                    .recipient(event.getOrganizerUsername())
                    .status(NotificationStatus.SENT)
                    .sentAt(LocalDateTime.now())
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.info("✅ Notification saved to database. Notification ID: {}", saved.getId());

        } catch (Exception e) {
            log.error("❌ Error processing event-updated message", e);
        }
    }

    @KafkaListener(topics = "event-deleted", groupId = "notification-service-group", containerFactory = "kafkaListenerContainerFactory")
    public void onEventDeleted(EventMessage event) {
        log.info("╔═══════════════════════════════════════════════════════════╗");
        log.info("║ ✉️  KAFKA MESSAGE RECEIVED - event-deleted                 ║");
        log.info("║ Event ID: {} | Event Name: {}                             ║", event.getId(), event.getName());
        log.info("╚═══════════════════════════════════════════════════════════╝");

        try {
            Notification notification = Notification.builder()
                    .eventId(event.getId())
                    .userId(1L)
                    .notificationType(NotificationType.EMAIL)
                    .title("Event Cancelled")
                    .message("The event '" + event.getName() + "' has been cancelled.")
                    .recipient(event.getOrganizerUsername())
                    .status(NotificationStatus.SENT)
                    .sentAt(LocalDateTime.now())
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.info("✅ Notification saved to database. Notification ID: {}", saved.getId());

        } catch (Exception e) {
            log.error("❌ Error processing event-deleted message", e);
        }
    }
}
