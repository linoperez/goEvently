package com.goevently.eventservice.controller;

import com.goevently.eventservice.dto.ApiResponse;
import com.goevently.eventservice.dto.CreateEventRequest;
import com.goevently.eventservice.dto.EventResponse;
import com.goevently.eventservice.dto.UpdateEventRequest;
import com.goevently.eventservice.service.EventService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.goevently.eventservice.dto.EventFilterRequest;
import java.time.LocalDateTime;

import com.goevently.eventservice.dto.EventSearchRequest;


/**
 * REST controller for handling event-related API requests.
 * Exposes endpoints for creating, retrieving, updating, and deleting events.
 */
@RestController
@RequestMapping("/api/events")
@Slf4j
public class EventController {

    private final EventService eventService;

    @Autowired
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /**
     * Endpoint for creating a new event.
     * Only users with ORGANIZER or ADMIN roles can create events.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody CreateEventRequest request) {
        log.info("Received request to create event: {}", request.getName());

        String organizerUsername = getCurrentUsername();
        EventResponse eventResponse = eventService.createEvent(request, organizerUsername);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event created successfully")
                .data(eventResponse)
                .build();

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Endpoint for retrieving a single event by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable Long id) {
        log.info("Received request to get event with ID: {}", id);

        EventResponse eventResponse = eventService.getEventById(id);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event retrieved successfully")
                .data(eventResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint for retrieving all events.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        log.info("Received request to get all events");

        List<EventResponse> events = eventService.getAllEvents();

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint for retrieving events by a specific organizer.
     */
    @GetMapping("/organizer/{organizerUsername}")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByOrganizer(
            @PathVariable String organizerUsername) {
        log.info("Received request to get events for organizer: {}", organizerUsername);

        List<EventResponse> events = eventService.getEventsByOrganizer(organizerUsername);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint for updating an existing event.
     * Only the organizer who created the event can update it.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request) {
        log.info("Received request to update event ID: {}", id);

        String username = getCurrentUsername();
        EventResponse eventResponse = eventService.updateEvent(id, request, username);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event updated successfully")
                .data(eventResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint for deleting an event.
     * Only the organizer who created the event can delete it.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        log.info("Received request to delete event ID: {}", id);

        String username = getCurrentUsername();
        eventService.deleteEvent(id, username);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Event deleted successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Filter events by city.
     *
     * GET /api/events/filter/by-city?city=Mumbai
     */
    @GetMapping("/filter/by-city")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> filterEventsByCity(
            @RequestParam String city) {

        log.info("API Call: Filtering events by city - {}", city);

        List<EventResponse> events = eventService.filterEventsByCity(city);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully for city: " + city)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Filter events by date range.
     *
     * GET /api/events/filter/by-date-range?startDate=2025-12-01T00:00:00&endDate=2025-12-31T23:59:59
     */
    @GetMapping("/filter/by-date-range")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> filterEventsByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {

        log.info("API Call: Filtering events by date range - {} to {}", startDate, endDate);

        List<EventResponse> events = eventService.filterEventsByDateRange(startDate, endDate);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully for date range")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Filter events by month.
     *
     * GET /api/events/filter/by-month?year=2025&month=12
     */
    @GetMapping("/filter/by-month")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> filterEventsByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        log.info("API Call: Filtering events by month - {}/{}", month, year);

        List<EventResponse> events = eventService.filterEventsByMonth(year, month);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully for month: " + month + "/" + year)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Advanced filtering with multiple optional filters.
     * Supports combining city, category, venue, date range, organizer, and capacity filters.
     *
     * Examples:
     * GET /api/events/filter/advanced?city=Mumbai&month=12&year=2025
     * GET /api/events/filter/advanced?city=Mumbai&categoryId=1
     * GET /api/events/filter/advanced?year=2025&month=12&minCapacity=100
     *
     * POST /api/events/filter/advanced
     * Body: { "city": "Mumbai", "month": 12, "year": 2025, "categoryId": 1 }
     */
    @PostMapping("/filter/advanced")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> filterEventsAdvanced(
            @RequestBody EventFilterRequest filter) {

        log.info("API Call: Advanced event filtering - {}", filter);

        List<EventResponse> events = eventService.filterEventsAdvanced(filter);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully with applied filters")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Alternative advanced filtering endpoint using query parameters.
     * Useful for simple filtering without request body.
     *
     * GET /api/events/filter?city=Mumbai&categoryId=1&year=2025&month=12
     */
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> filterEventsAdvancedQueryParams(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String organizerUsername,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer minCapacity) {

        log.info("API Call: Advanced filtering with query parameters - " +
                "city={}, categoryId={}, year={}, month={}", city, categoryId, year, month);

        EventFilterRequest filter = EventFilterRequest.builder()
                .city(city)
                .venueId(venueId)
                .categoryId(categoryId)
                .organizerUsername(organizerUsername)
                .year(year)
                .month(month)
                .minCapacity(minCapacity)
                .build();

        List<EventResponse> events = eventService.filterEventsAdvanced(filter);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully with applied filters")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Global search across all event fields.
     * Searches event name, description, venue name, and category name.
     *
     * GET /api/events/search?keyword=Bollywood
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> globalSearch(
            @RequestParam String keyword) {

        log.info("API Call: Global search with keyword - {}", keyword);

        List<EventResponse> events = eventService.globalSearchEvents(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by name only.
     *
     * GET /api/events/search/by-name?keyword=Concert
     */
    @GetMapping("/search/by-name")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByName(
            @RequestParam String keyword) {

        log.info("API Call: Search by name - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByName(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by name for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by description only.
     *
     * GET /api/events/search/by-description?keyword=live
     */
    @GetMapping("/search/by-description")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByDescription(
            @RequestParam String keyword) {

        log.info("API Call: Search by description - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByDescription(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by description for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by name and description combined.
     *
     * GET /api/events/search/by-name-description?keyword=music
     */
    @GetMapping("/search/by-name-description")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByNameOrDescription(
            @RequestParam String keyword) {

        log.info("API Call: Search by name or description - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByNameOrDescription(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by name or description for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by venue name.
     *
     * GET /api/events/search/by-venue?keyword=Madison
     */
    @GetMapping("/search/by-venue")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByVenue(
            @RequestParam String keyword) {

        log.info("API Call: Search by venue - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByVenueName(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by venue for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by category name.
     *
     * GET /api/events/search/by-category?keyword=Music
     */
    @GetMapping("/search/by-category")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByCategory(
            @RequestParam String keyword) {

        log.info("API Call: Search by category - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByCategory(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by category for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Search events by organizer username.
     *
     * GET /api/events/search/by-organizer?keyword=john
     */
    @GetMapping("/search/by-organizer")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> searchByOrganizer(
            @RequestParam String keyword) {

        log.info("API Call: Search by organizer - {}", keyword);

        List<EventResponse> events = eventService.searchEventsByOrganizerUsername(keyword);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Search results by organizer for keyword: " + keyword)
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Advanced search with search type specification.
     * Allows specifying which fields to search in.
     *
     * POST /api/events/search/advanced
     * Body: { "keyword": "music", "searchType": "global" }
     *
     * Supported searchTypes:
     * - "global" (default): Search all fields
     * - "name": Search event name only
     * - "description": Search description only
     * - "name_description": Search name and description
     * - "venue": Search venue name
     * - "category": Search category name
     * - "organizer": Search organizer username
     */
    @PostMapping("/search/advanced")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> advancedSearch(
            @Valid @RequestBody EventSearchRequest searchRequest) {

        log.info("API Call: Advanced search - Type: {}, Keyword: {}",
                searchRequest.getSearchType(), searchRequest.getKeyword());

        List<EventResponse> events = eventService.advancedSearch(searchRequest);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Advanced search results for: " + searchRequest.getKeyword())
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }



    /**
     * Helper method to get the current authenticated username.
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
