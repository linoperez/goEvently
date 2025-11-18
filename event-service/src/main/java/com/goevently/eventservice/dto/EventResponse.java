package com.goevently.eventservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse implements Serializable {  // ← ADD THIS
    private static final long serialVersionUID = 1L;  // ← ADD THIS

    private Long id;
    private String name;
    private String description;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxAttendees;
    private Long venueId;
    private String venueName;
    private Long categoryId;
    private String categoryName;
    private String organizerUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
