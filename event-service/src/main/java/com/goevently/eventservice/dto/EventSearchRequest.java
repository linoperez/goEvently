package com.goevently.eventservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for advanced event searching with search type specification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSearchRequest {

    /**
     * The search keyword
     * Required field
     */
    @NotBlank(message = "Search keyword cannot be empty")
    @Size(min = 1, max = 100, message = "Search keyword must be between 1 and 100 characters")
    private String keyword;

    /**
     * Type of search to perform.
     * Options: "global", "name", "description", "venue", "category", "organizer"
     * Default: "global" (searches all fields)
     */
    @Builder.Default
    private String searchType = "global";
}
