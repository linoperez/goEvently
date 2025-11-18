package com.goevently.notificationservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EventMessage {

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
