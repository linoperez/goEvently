package com.goevently.eventservice.util;

import com.goevently.eventservice.dto.CreateEventRequest;
import com.goevently.eventservice.dto.EventResponse;
import com.goevently.eventservice.dto.UpdateEventRequest;
import com.goevently.eventservice.entity.Event;
import org.springframework.stereotype.Component;

/**
 * Utility class for mapping between Event entities and DTOs.
 */
@Component
public class EventMapper {

    /**
     * Converts CreateEventRequest DTO to Event entity.
     */
    public Event toEntity(CreateEventRequest request, String organizerUsername) {
        return Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxAttendees(request.getMaxAttendees())
                .organizerUsername(organizerUsername)
                .build();
    }

    /**
     * Converts Event entity to EventResponse DTO.
     */
    public EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .location(event.getLocation())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .maxAttendees(event.getMaxAttendees())
                .organizerUsername(event.getOrganizerUsername())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    /**
     * Updates an existing Event entity with data from UpdateEventRequest.
     * Only updates non-null fields from the request.
     */
    public void updateEntity(Event event, UpdateEventRequest request) {
        if (request.getName() != null) {
            event.setName(request.getName());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getStartTime() != null) {
            event.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            event.setEndTime(request.getEndTime());
        }
        if (request.getMaxAttendees() != null) {
            event.setMaxAttendees(request.getMaxAttendees());
        }
    }
}
