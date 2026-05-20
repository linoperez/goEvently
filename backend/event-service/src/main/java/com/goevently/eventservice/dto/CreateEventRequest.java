package com.goevently.eventservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for creating new events.
 */
@Data
public class CreateEventRequest {

    @NotBlank(message = "Event name cannot be blank")
    @Size(min = 3, max = 100, message = "Event name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Event description cannot be blank")
    @Size(min = 10, max = 1000, message = "Event description must be between 10 and 1000 characters")
    private String description;

    @NotBlank(message = "Event location cannot be blank")
    @Size(min = 5, max = 200, message = "Event location must be between 5 and 200 characters")
    private String location;

    @NotNull(message = "Start time cannot be null")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time cannot be null")
    private LocalDateTime endTime;

    @NotNull(message = "Max attendees cannot be null")
    @Min(value = 1, message = "Max attendees must be at least 1")
    @Max(value = 100000, message = "Max attendees cannot exceed 100,000")
    private Integer maxAttendees;
    private Long venueId;
    private Long categoryId;


    // Custom validation for end time > start time will be added in service layer
}
