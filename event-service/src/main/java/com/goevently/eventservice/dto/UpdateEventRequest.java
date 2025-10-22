package com.goevently.eventservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for updating existing events.
 */
@Data
public class UpdateEventRequest {

    @Size(min = 3, max = 100, message = "Event name must be between 3 and 100 characters")
    private String name;

    @Size(min = 10, max = 1000, message = "Event description must be between 10 and 1000 characters")
    private String description;

    @Size(min = 5, max = 200, message = "Event location must be between 5 and 200 characters")
    private String location;

    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Min(value = 1, message = "Max attendees must be at least 1")
    @Max(value = 100000, message = "Max attendees cannot exceed 100,000")
    private Integer maxAttendees;
}
