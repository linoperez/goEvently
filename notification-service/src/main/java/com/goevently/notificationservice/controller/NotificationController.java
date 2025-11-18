package com.goevently.notificationservice.controller;

import com.goevently.notificationservice.dto.ApiResponse;
import com.goevently.notificationservice.dto.NotificationResponse;
import com.goevently.notificationservice.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Get all notifications for a user
     * GET /api/notifications/user/{userId}?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUserNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            log.info("Fetching notifications for user: {} (page: {}, size: {})", userId, page, size);

            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<NotificationResponse> notifications = notificationService.getUserNotifications(userId, pageable);

            return ResponseEntity.ok(ApiResponse.success(
                    "Notifications retrieved successfully",
                    notifications
            ));

        } catch (Exception e) {
            log.error("Error fetching notifications for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching notifications"));
        }
    }

    /**
     * Get unread/pending notifications for a user
     * GET /api/notifications/user/{userId}/unread?page=0&size=10
     */
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUnreadNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            log.info("Fetching unread notifications for user: {}", userId);

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId, pageable);

            return ResponseEntity.ok(ApiResponse.success(
                    "Unread notifications retrieved successfully",
                    notifications
            ));

        } catch (Exception e) {
            log.error("Error fetching unread notifications for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching unread notifications"));
        }
    }

    /**
     * Get a specific notification by ID
     * GET /api/notifications/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationResponse>> getNotificationById(
            @PathVariable Long id) {

        try {
            log.info("Fetching notification with ID: {}", id);

            NotificationResponse notification = notificationService.getNotificationById(id);

            return ResponseEntity.ok(ApiResponse.success(
                    "Notification retrieved successfully",
                    notification
            ));

        } catch (Exception e) {
            log.error("Error fetching notification with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Notification not found"));
        }
    }

    /**
     * Mark notification as sent
     * PUT /api/notifications/{id}/mark-sent
     */
    @PutMapping("/{id}/mark-sent")
    public ResponseEntity<ApiResponse<?>> markNotificationAsSent(
            @PathVariable Long id) {

        try {
            log.info("Marking notification {} as sent", id);

            notificationService.markAsSent(id);

            return ResponseEntity.ok(ApiResponse.success(
                    "Notification marked as sent",
                    null
            ));

        } catch (Exception e) {
            log.error("Error marking notification {} as sent", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Notification not found"));
        }
    }

    /**
     * Mark notification as failed
     * PUT /api/notifications/{id}/mark-failed
     */
    @PutMapping("/{id}/mark-failed")
    public ResponseEntity<ApiResponse<?>> markNotificationAsFailed(
            @PathVariable Long id,
            @RequestParam String errorMessage) {

        try {
            log.info("Marking notification {} as failed with error: {}", id, errorMessage);

            notificationService.markAsFailed(id, errorMessage);

            return ResponseEntity.ok(ApiResponse.success(
                    "Notification marked as failed",
                    null
            ));

        } catch (Exception e) {
            log.error("Error marking notification {} as failed", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Notification not found"));
        }
    }

    /**
     * Retry failed notifications
     * POST /api/notifications/retry-failed
     */
    @PostMapping("/retry-failed")
    public ResponseEntity<ApiResponse<?>> retryFailedNotifications() {

        try {
            log.info("Retrying failed notifications...");

            notificationService.retryFailedNotifications();

            return ResponseEntity.ok(ApiResponse.success(
                    "Retry process started for failed notifications",
                    null
            ));

        } catch (Exception e) {
            log.error("Error retrying failed notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrying notifications"));
        }
    }

    /**
     * Health check endpoint
     * GET /api/notifications/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<?>> health() {
        return ResponseEntity.ok(ApiResponse.success("Notification Service is up and running", null));
    }
}
