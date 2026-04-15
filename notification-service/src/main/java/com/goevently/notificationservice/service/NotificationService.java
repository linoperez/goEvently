package com.goevently.notificationservice.service;

import com.goevently.notificationservice.dto.EventMessage;
import com.goevently.notificationservice.dto.NotificationRequest;
import com.goevently.notificationservice.dto.NotificationResponse;
import com.goevently.notificationservice.entity.Notification;
import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
import com.goevently.notificationservice.exception.ResourceNotFoundException;
import com.goevently.notificationservice.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InAppNotificationService inAppService;

    /**
     * Send notification when event is created
     */


    public Notification createNotification(Long userId,
                                           Long eventId,
                                           com.goevently.notificationservice.entity.NotificationType notificationType,
                                           String title,
                                           String message,
                                           String recipient,
                                           com.goevently.notificationservice.entity.NotificationStatus status) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setEventId(eventId);
        notification.setNotificationType(notificationType);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRecipient(recipient);
        notification.setStatus(status);

        if (status == com.goevently.notificationservice.entity.NotificationStatus.SENT) {
            notification.setSentAt(java.time.LocalDateTime.now());
        }

        return notificationRepository.save(notification);
    }





    /**
     * Send in-app notification
     */
    public void sendInAppNotification(EventMessage event, String eventAction) {
        log.info("Sending in-app notification for event: {} - Action: {}", event.getName(), eventAction);

        String message = String.format(
                "%s '%s' scheduled for %s",
                eventAction, event.getName(), event.getStartTime()
        );

        try {
            Notification notification = Notification.builder()
                    .eventId(event.getId())
                    .userId(1L)
                    .notificationType(NotificationType.IN_APP)
                    .title(eventAction)
                    .message(message)
                    .status(NotificationStatus.SENT)
                    .sentAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);

        } catch (Exception e) {
            log.error("Error sending in-app notification for event: {}", event.getId(), e);
        }
    }

    /**
     * Get all notifications for a user with pagination
     */
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        log.info("Fetching notifications for user: {}", userId);
        return notificationRepository.findByUserId(userId, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Get unread notifications for a user
     */
    public Page<NotificationResponse> getUnreadNotifications(Long userId, Pageable pageable) {
        log.info("Fetching unread notifications for user: {}", userId);
        return notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.PENDING, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Get notification by ID
     */
    public NotificationResponse getNotificationById(Long id) {
        log.info("Fetching notification with ID: {}", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        return convertToResponse(notification);
    }

    /**
     * Mark notification as sent
     */
    public void markAsSent(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        notificationRepository.save(notification);

        log.info("Marked notification {} as SENT", notificationId);
    }

    /**
     * Mark notification as failed
     */
    public void markAsFailed(Long notificationId, String errorMessage) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        notification.setStatus(NotificationStatus.FAILED);
        notification.setErrorMessage(errorMessage);
        notification.setRetryCount((notification.getRetryCount() != null ? notification.getRetryCount() : 0) + 1);
        notificationRepository.save(notification);

        log.error("Marked notification {} as FAILED. Error: {}", notificationId, errorMessage);
    }



    /**
     * Convert Notification entity to NotificationResponse DTO
     */
    private NotificationResponse convertToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .eventId(notification.getEventId())
                .userId(notification.getUserId())
                .notificationType(notification.getNotificationType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .recipient(notification.getRecipient())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .sentAt(notification.getSentAt())
                .retryCount(notification.getRetryCount())
                .errorMessage(notification.getErrorMessage())
                .build();
    }
}
