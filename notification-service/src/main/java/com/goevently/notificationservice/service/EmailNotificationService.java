package com.goevently.notificationservice.service;

import com.goevently.notificationservice.entity.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationService {

    /**
     * Send email notification
     * In production, integrate with SendGrid, AWS SES, or any email provider
     */
    public void sendEmail(Notification notification) {
        try {
            log.info("Sending email notification to: {}", notification.getRecipient());

            // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
            // For now, just log the email
            log.info("Email Title: {}", notification.getTitle());
            log.info("Email Body: {}", notification.getMessage());
            log.info("Email sent successfully to: {}", notification.getRecipient());

            // Update notification status
            notification.setStatus(com.goevently.notificationservice.entity.NotificationStatus.SENT);

        } catch (Exception e) {
            log.error("Error sending email to: {}", notification.getRecipient(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
