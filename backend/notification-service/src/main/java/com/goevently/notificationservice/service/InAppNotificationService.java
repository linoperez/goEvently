package com.goevently.notificationservice.service;

import com.goevently.notificationservice.entity.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class InAppNotificationService {

    /**
     * Store in-app notification
     * In production, you can integrate with real-time systems like WebSocket or Firebase
     */
    public void saveInAppNotification(Notification notification) {
        try {
            log.info("Storing in-app notification for user: {}", notification.getUserId());
            log.info("Notification Title: {}", notification.getTitle());
            log.info("Notification Message: {}", notification.getMessage());

            // The notification is already saved in the database by NotificationService
            log.info("In-app notification stored successfully");

        } catch (Exception e) {
            log.error("Error storing in-app notification for user: {}", notification.getUserId(), e);
            throw new RuntimeException("Failed to store in-app notification", e);
        }
    }
}
