package com.goevently.eventservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for advanced event filtering with multiple filters.
 * All fields are optional - only provided fields will be applied as filters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFilterRequest {

    /**
     * Filter by city (via venue relationship)
     * Example: "Mumbai", "New York"
     */
    private String city;

    /**
     * Filter by venue ID
     * Example: 1, 5, 10
     */
    private Long venueId;

    /**
     * Filter by category ID
     * Example: 1, 2, 3
     */
    private Long categoryId;

    /**
     * Filter by organizer username
     * Example: "user123"
     */
    private String organizerUsername;

    /**
     * Filter by start date (events on or after this date)
     * Example: "2025-12-01T00:00:00"
     */
    private LocalDateTime startDate;

    /**
     * Filter by end date (events on or before this date)
     * Example: "2025-12-31T23:59:59"
     */
    private LocalDateTime endDate;

    /**
     * Filter by year and month
     * Example: year=2025, month=12
     * Note: If both are provided, startDate and endDate are calculated
     */
    private Integer year;
    private Integer month;

    /**
     * Filter by max attendees threshold (events with capacity >= this value)
     * Useful for finding large venues/events
     */
    private Integer minCapacity;
}
