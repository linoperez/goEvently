package com.goevently.notificationservice.repository;

import com.goevently.notificationservice.entity.Notification;
import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find by user ID
    Page<Notification> findByUserId(Long userId, Pageable pageable);

    // Find by event ID
    List<Notification> findByEventId(Long eventId);

    // Find by status
    Page<Notification> findByStatus(NotificationStatus status, Pageable pageable);

    // Find by user and status
    Page<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status, Pageable pageable);

    // Find by type
    List<Notification> findByNotificationType(NotificationType type);

    // Find pending notifications
    List<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, Integer maxRetries);
}
