package com.goevently.eventservice.util;

import com.goevently.eventservice.dto.VenueResponse;
import com.goevently.eventservice.entity.Venue;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper {

    public VenueResponse toResponse(Venue venue) {
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .address(venue.getAddress())
                .city(venue.getCity())
                .state(venue.getState())
                .country(venue.getCountry())
                .zipCode(venue.getZipCode())
                .capacity(venue.getCapacity())
                .description(venue.getDescription())
                .status(venue.getStatus())
                .createdAt(venue.getCreatedAt())
                .updatedAt(venue.getUpdatedAt())
                .build();
    }
}
