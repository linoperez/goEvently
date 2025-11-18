package com.goevently.notificationservice.dto;

import com.goevently.notificationservice.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Notification type is required")
    private NotificationType notificationType;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private String recipient; // Email or phone number
}
