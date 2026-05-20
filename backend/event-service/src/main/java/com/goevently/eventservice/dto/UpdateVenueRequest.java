package com.goevently.eventservice.dto;

import com.goevently.eventservice.entity.VenueStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVenueRequest {

    @Size(min = 3, max = 100, message = "Venue name must be between 3 and 100 characters")
    private String name;

    @Size(min = 5, max = 200, message = "Address must be between 5 and 200 characters")
    private String address;

    @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
    private String city;

    @Size(min = 2, max = 50, message = "State must be between 2 and 50 characters")
    private String state;

    @Size(min = 2, max = 50, message = "Country must be between 2 and 50 characters")
    private String country;

    @Size(max = 20, message = "Zip code cannot exceed 20 characters")
    private String zipCode;

    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 1000000, message = "Capacity cannot exceed 1,000,000")
    private Integer capacity;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private VenueStatus status;
}
