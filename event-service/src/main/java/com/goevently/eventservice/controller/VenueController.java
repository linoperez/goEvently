package com.goevently.eventservice.controller;

import com.goevently.eventservice.dto.ApiResponse;
import com.goevently.eventservice.dto.CreateVenueRequest;
import com.goevently.eventservice.dto.UpdateVenueRequest;
import com.goevently.eventservice.dto.VenueResponse;
import com.goevently.eventservice.entity.VenueStatus;
import com.goevently.eventservice.service.VenueService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing venues.
 * Provides endpoints for creating, retrieving, updating, and deleting venues.
 *
 * Base URL: /api/venues
 */
@RestController
@RequestMapping("/api/venues")
@Slf4j
public class VenueController {

    private final VenueService venueService;

    @Autowired
    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    /**
     * Create a new venue.
     * Only ADMIN and ORGANIZER roles can create venues.
     *
     * POST /api/venues
     *
     * @param request the CreateVenueRequest containing venue details
     * @return ResponseEntity with ApiResponse containing created VenueResponse
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<VenueResponse>> createVenue(
            @Valid @RequestBody CreateVenueRequest request) {

        log.info("API Call: Creating venue - {}", request.getName());

        VenueResponse venueResponse = venueService.createVenue(request);

        ApiResponse<VenueResponse> response = ApiResponse.<VenueResponse>builder()
                .success(true)
                .message("Venue created successfully")
                .data(venueResponse)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve all venues.
     * Accessible to all authenticated users.
     *
     * GET /api/venues
     *
     * @return ResponseEntity with ApiResponse containing list of VenueResponse
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<VenueResponse>>> getAllVenues() {

        log.info("API Call: Fetching all venues");

        List<VenueResponse> venues = venueService.getAllVenues();

        ApiResponse<List<VenueResponse>> response = ApiResponse.<List<VenueResponse>>builder()
                .success(true)
                .message("Venues retrieved successfully")
                .data(venues)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve a specific venue by its ID.
     * Accessible to all authenticated users.
     *
     * GET /api/venues/{id}
     *
     * @param id the venue ID
     * @return ResponseEntity with ApiResponse containing VenueResponse
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VenueResponse>> getVenueById(@PathVariable Long id) {

        log.info("API Call: Fetching venue with ID - {}", id);

        VenueResponse venueResponse = venueService.getVenueById(id);

        ApiResponse<VenueResponse> response = ApiResponse.<VenueResponse>builder()
                .success(true)
                .message("Venue retrieved successfully")
                .data(venueResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve all active venues.
     * Accessible to all authenticated users.
     *
     * GET /api/venues/filter/active
     *
     * @return ResponseEntity with ApiResponse containing list of active VenueResponse
     */
    @GetMapping("/filter/active")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<VenueResponse>>> getActiveVenues() {

        log.info("API Call: Fetching all active venues");

        List<VenueResponse> venues = venueService.getActiveVenues();

        ApiResponse<List<VenueResponse>> response = ApiResponse.<List<VenueResponse>>builder()
                .success(true)
                .message("Active venues retrieved successfully")
                .data(venues)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve all venues in a specific city.
     * Accessible to all authenticated users.
     *
     * GET /api/venues/search/city?city=NewYork
     *
     * @param city the city name to filter by
     * @return ResponseEntity with ApiResponse containing list of VenueResponse
     */
    @GetMapping("/search/city")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<VenueResponse>>> getVenuesByCity(
            @RequestParam String city) {

        log.info("API Call: Fetching venues by city - {}", city);

        List<VenueResponse> venues = venueService.getVenuesByCity(city);

        ApiResponse<List<VenueResponse>> response = ApiResponse.<List<VenueResponse>>builder()
                .success(true)
                .message("Venues retrieved successfully for city: " + city)
                .data(venues)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve all active venues in a specific city.
     * Accessible to all authenticated users.
     *
     * GET /api/venues/search/active-by-city?city=NewYork
     *
     * @param city the city name to filter by
     * @return ResponseEntity with ApiResponse containing list of active VenueResponse
     */
    @GetMapping("/search/active-by-city")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<VenueResponse>>> getActiveVenuesByCity(
            @RequestParam String city) {

        log.info("API Call: Fetching active venues by city - {}", city);

        List<VenueResponse> venues = venueService.getActiveVenuesByCity(city);

        ApiResponse<List<VenueResponse>> response = ApiResponse.<List<VenueResponse>>builder()
                .success(true)
                .message("Active venues retrieved successfully for city: " + city)
                .data(venues)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing venue.
     * Only ADMIN role can update venues.
     *
     * PUT /api/venues/{id}
     *
     * @param id the venue ID
     * @param request the UpdateVenueRequest containing updated venue details
     * @return ResponseEntity with ApiResponse containing updated VenueResponse
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VenueResponse>> updateVenue(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVenueRequest request) {

        log.info("API Call: Updating venue with ID - {}", id);

        VenueResponse venueResponse = venueService.updateVenue(id, request);

        ApiResponse<VenueResponse> response = ApiResponse.<VenueResponse>builder()
                .success(true)
                .message("Venue updated successfully")
                .data(venueResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a venue.
     * Only ADMIN role can delete venues.
     *
     * DELETE /api/venues/{id}
     *
     * @param id the venue ID
     * @return ResponseEntity with ApiResponse containing success message
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVenue(@PathVariable Long id) {

        log.info("API Call: Deleting venue with ID - {}", id);

        venueService.deleteVenue(id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Venue deleted successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Update venue status.
     * Only ADMIN role can update venue status.
     *
     * PATCH /api/venues/{id}/status?status=INACTIVE
     *
     * @param id the venue ID
     * @param status the new VenueStatus
     * @return ResponseEntity with ApiResponse containing updated VenueResponse
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VenueResponse>> updateVenueStatus(
            @PathVariable Long id,
            @RequestParam VenueStatus status) {

        log.info("API Call: Updating venue status for ID - {} to {}", id, status);

        VenueResponse venueResponse = venueService.updateVenueStatus(id, status);

        ApiResponse<VenueResponse> response = ApiResponse.<VenueResponse>builder()
                .success(true)
                .message("Venue status updated successfully")
                .data(venueResponse)
                .build();

        return ResponseEntity.ok(response);
    }
}
