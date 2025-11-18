package com.goevently.notificationservice.dto;

import com.goevently.notificationservice.entity.NotificationStatus;
import com.goevently.notificationservice.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long eventId;
    private Long userId;
    private NotificationType notificationType;
    private String title;
    private String message;
    private String recipient;
    private NotificationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private Integer retryCount;
    private String errorMessage;
}
