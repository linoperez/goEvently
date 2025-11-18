package com.goevently.notificationservice.service;

import com.goevently.notificationservice.entity.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsNotificationService {

    /**
     * Send SMS notification
     * In production, integrate with Twilio, AWS SNS, or any SMS provider
     */
    public void sendSms(Notification notification) {
        try {
            log.info("Sending SMS notification to: {}", notification.getRecipient());

            // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
            // For now, just log the SMS
            log.info("SMS Title: {}", notification.getTitle());
            log.info("SMS Body: {}", notification.getMessage());
            log.info("SMS sent successfully to: {}", notification.getRecipient());

            // Update notification status
            notification.setStatus(com.goevently.notificationservice.entity.NotificationStatus.SENT);

        } catch (Exception e) {
            log.error("Error sending SMS to: {}", notification.getRecipient(), e);
            throw new RuntimeException("Failed to send SMS", e);
        }
    }
}
