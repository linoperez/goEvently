package com.goevently.eventservice.dto;

import com.goevently.eventservice.entity.VenueStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVenueRequest {

    @NotBlank(message = "Venue name cannot be blank")
    @Size(min = 3, max = 100, message = "Venue name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Address cannot be blank")
    @Size(min = 5, max = 200, message = "Address must be between 5 and 200 characters")
    private String address;

    @NotBlank(message = "City cannot be blank")
    @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
    private String city;

    @NotBlank(message = "State cannot be blank")
    @Size(min = 2, max = 50, message = "State must be between 2 and 50 characters")
    private String state;

    @NotBlank(message = "Country cannot be blank")
    @Size(min = 2, max = 50, message = "Country must be between 2 and 50 characters")
    private String country;

    @Size(max = 20, message = "Zip code cannot exceed 20 characters")
    private String zipCode;

    @NotNull(message = "Capacity cannot be null")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 1000000, message = "Capacity cannot exceed 1,000,000")
    private Integer capacity;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private VenueStatus status;
}
