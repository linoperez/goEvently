package com.goevently.eventservice.service;

import com.goevently.eventservice.dto.CreateEventRequest;
import com.goevently.eventservice.dto.EventResponse;
import com.goevently.eventservice.dto.UpdateEventRequest;
import com.goevently.eventservice.entity.Event;
import com.goevently.eventservice.entity.EventCategory;
import com.goevently.eventservice.entity.Venue;
import com.goevently.eventservice.exception.EventException;
import com.goevently.eventservice.repository.EventCategoryRepository;
import com.goevently.eventservice.repository.EventRepository;
import com.goevently.eventservice.repository.VenueRepository;
import com.goevently.eventservice.util.EventMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.goevently.eventservice.dto.EventFilterRequest;
import java.time.YearMonth;
import java.time.LocalDate;

import com.goevently.eventservice.dto.EventSearchRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;


/**
 * Service layer for handling event-related business logic.
 * Contains methods for creating, retrieving, updating, and managing events.
 */
@Service
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final VenueRepository venueRepository;
    private final EventCategoryRepository eventCategoryRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    public EventService(EventRepository eventRepository,
                        EventMapper eventMapper,
                        VenueRepository venueRepository,
                        EventCategoryRepository eventCategoryRepository) {
        this.eventRepository = eventRepository;
        this.eventMapper = eventMapper;
        this.venueRepository = venueRepository;
        this.eventCategoryRepository = eventCategoryRepository;
    }

    /**
     * Creates a new event with business validation.
     * Assigns venue and category if provided.
     *
     * @param request the CreateEventRequest containing event details
     * @param organizerUsername the username of the event organizer
     * @return EventResponse with the created event data
     * @throws EventException if validation fails or venue/category not found
     */

    @CacheEvict(value = { "events-getAll", "events-byCategory", "events-byVenue" }, allEntries = true)
    @Transactional
    public EventResponse createEvent(CreateEventRequest request, String organizerUsername) {
        log.info("Creating event: {} by organizer: {}", request.getName(), organizerUsername);

        // Business validation
        validateEventTimes(request.getStartTime(), request.getEndTime());

        // Convert DTO to entity
        Event event = eventMapper.toEntity(request, organizerUsername);

        // Assign venue if provided
        if (request.getVenueId() != null) {
            Venue venue = venueRepository.findById(request.getVenueId())
                    .orElseThrow(() -> {
                        log.error("Venue not found with ID: {}", request.getVenueId());
                        return new EventException("Venue not found with ID: " + request.getVenueId());
                    });
            event.setVenue(venue);
            log.debug("Venue assigned to event: {}", venue.getName());
        }

        // Assign category if provided
        if (request.getCategoryId() != null) {
            EventCategory category = eventCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> {
                        log.error("Category not found with ID: {}", request.getCategoryId());
                        return new EventException("Category not found with ID: " + request.getCategoryId());
                    });
            event.setCategory(category);
            log.debug("Category assigned to event: {}", category.getName());
        }

        // Save and return response
        Event savedEvent = eventRepository.save(event);
        log.info("Event created successfully with ID: {}", savedEvent.getId());

        EventResponse response = eventMapper.toResponse(savedEvent);

        // NEW: Send Kafka message
        kafkaProducerService.sendEventCreated(response);

        return response;
    }

    /**
     * Retrieves an event by its unique ID.
     *
     * @param id the event ID
     * @return EventResponse containing event details
     * @throws EventException if event not found
     */
    public EventResponse getEventById(Long id) {
        log.debug("Fetching event with ID: {}", id);

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Event not found with ID: {}", id);
                    return new EventException("Event not found with ID: " + id);
                });

        return eventMapper.toResponse(event);
    }

    /**
     * Retrieves all events from the database.
     *
     * @return List of EventResponse containing all events
     */
    @Cacheable(value = "events-getAll")
    public List<EventResponse> getAllEvents() {
        log.debug("Fetching all events");

        return eventRepository.findAll().stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all events created by a specific organizer.
     *
     * @param organizerUsername the organizer's username
     * @return List of EventResponse containing organizer's events
     */
    public List<EventResponse> getEventsByOrganizer(String organizerUsername) {
        log.debug("Fetching events for organizer: {}", organizerUsername);

        return eventRepository.findByOrganizerUsername(organizerUsername).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all events in a specific category.
     *
     * @param categoryId the category ID
     * @return List of EventResponse containing events in the category
     */

    @Cacheable(value = "events-byCategory", key = "#categoryId")
    public List<EventResponse> getEventsByCategory(Long categoryId) {
        log.debug("Fetching events in category: {}", categoryId);

        // Verify category exists
        if (!eventCategoryRepository.existsById(categoryId)) {
            log.error("Category not found with ID: {}", categoryId);
            throw new EventException("Category not found with ID: " + categoryId);
        }

        return eventRepository.findAll().stream()
                .filter(event -> event.getCategory() != null && event.getCategory().getId().equals(categoryId))
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all events at a specific venue.
     *
     * @param venueId the venue ID
     * @return List of EventResponse containing events at the venue
     */

    @Cacheable(value = "events-byVenue", key = "#venueId")
    public List<EventResponse> getEventsByVenue(Long venueId) {
        log.debug("Fetching events at venue: {}", venueId);

        // Verify venue exists
        if (!venueRepository.existsById(venueId)) {
            log.error("Venue not found with ID: {}", venueId);
            throw new EventException("Venue not found with ID: " + venueId);
        }

        return eventRepository.findAll().stream()
                .filter(event -> event.getVenue() != null && event.getVenue().getId().equals(venueId))
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing event.
     * Only the organizer who created the event can update it.
     * Can update venue and category if new IDs are provided.
     *
     * @param id the event ID
     * @param request the UpdateEventRequest containing updated event details
     * @param username the username of the user attempting to update
     * @return EventResponse with the updated event data
     * @throws EventException if event not found, authorization fails, or validation fails
     */

    @CacheEvict(value = { "events-getAll", "events-byCategory", "events-byVenue" }, allEntries = true)
    @Transactional
    public EventResponse updateEvent(Long id, UpdateEventRequest request, String username) {
        log.info("Updating event ID: {} by user: {}", id, username);

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Event not found with ID: {}", id);
                    return new EventException("Event not found with ID: " + id);
                });

        // Authorization: Only the organizer can update their event
        if (!event.getOrganizerUsername().equals(username)) {
            log.warn("Unauthorized update attempt for event ID: {} by user: {}", id, username);
            throw new EventException("You are not authorized to update this event");
        }

        // Validate times if they're being updated
        LocalDateTime newStartTime = request.getStartTime() != null ? request.getStartTime() : event.getStartTime();
        LocalDateTime newEndTime = request.getEndTime() != null ? request.getEndTime() : event.getEndTime();
        validateEventTimes(newStartTime, newEndTime);

        // Update direct event fields
        eventMapper.updateEntity(event, request);

        // Update venue if provided
        if (request.getVenueId() != null) {
            Venue venue = venueRepository.findById(request.getVenueId())
                    .orElseThrow(() -> {
                        log.error("Venue not found with ID: {}", request.getVenueId());
                        return new EventException("Venue not found with ID: " + request.getVenueId());
                    });
            event.setVenue(venue);
            log.debug("Venue updated for event ID: {} to {}", id, venue.getName());
        }

        // Update category if provided
        if (request.getCategoryId() != null) {
            EventCategory category = eventCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> {
                        log.error("Category not found with ID: {}", request.getCategoryId());
                        return new EventException("Category not found with ID: " + request.getCategoryId());
                    });
            event.setCategory(category);
            log.debug("Category updated for event ID: {} to {}", id, category.getName());
        }

        // Save and return response
        Event updatedEvent = eventRepository.save(event);
        log.info("Event updated successfully: {}", updatedEvent.getId());

        EventResponse response = eventMapper.toResponse(updatedEvent);

        // NEW: Send Kafka message
        kafkaProducerService.sendEventUpdated(response);

        return response;
    }

    /**
     * Deletes an event.
     * Only the organizer who created the event can delete it.
     *
     * @param id the event ID
     * @param username the username of the user attempting to delete
     * @throws EventException if event not found or authorization fails
     */

    @CacheEvict(value = { "events-getAll", "events-byCategory", "events-byVenue" }, allEntries = true)
    @Transactional
    public void deleteEvent(Long id, String username) {
        log.info("Deleting event ID: {} by user: {}", id, username);

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new EventException("Event not found with ID: " + id));

        EventResponse deletedEventResponse = eventMapper.toResponse(event);

        // Authorization: Only the organizer can delete their event
        if (!event.getOrganizerUsername().equals(username)) {
            log.warn("Unauthorized delete attempt for event ID: {} by user: {}", id, username);
            throw new EventException("You are not authorized to delete this event");
        }

        eventRepository.delete(event);

        // NEW: Send Kafka message
        kafkaProducerService.sendEventDeleted(deletedEventResponse);
        log.info("Event deleted successfully: {}", id);
    }

    /**
     * Assigns a venue to an event.
     * Only the event organizer can assign a venue.
     *
     * @param eventId the event ID
     * @param venueId the venue ID
     * @param username the username of the user attempting to assign
     * @return EventResponse with the updated event
     * @throws EventException if event/venue not found or authorization fails
     */
    @Transactional
    public EventResponse assignVenueToEvent(Long eventId, Long venueId, String username) {
        log.info("Assigning venue ID: {} to event ID: {} by user: {}", venueId, eventId, username);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Authorization
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to modify this event");
        }

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new EventException("Venue not found with ID: " + venueId));

        event.setVenue(venue);
        Event updatedEvent = eventRepository.save(event);

        log.info("Venue assigned successfully to event ID: {}", eventId);
        return eventMapper.toResponse(updatedEvent);
    }

    /**
     * Assigns a category to an event.
     * Only the event organizer can assign a category.
     *
     * @param eventId the event ID
     * @param categoryId the category ID
     * @param username the username of the user attempting to assign
     * @return EventResponse with the updated event
     * @throws EventException if event/category not found or authorization fails
     */
    @Transactional
    public EventResponse assignCategoryToEvent(Long eventId, Long categoryId, String username) {
        log.info("Assigning category ID: {} to event ID: {} by user: {}", categoryId, eventId, username);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Authorization
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to modify this event");
        }

        EventCategory category = eventCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new EventException("Category not found with ID: " + categoryId));

        event.setCategory(category);
        Event updatedEvent = eventRepository.save(event);

        log.info("Category assigned successfully to event ID: {}", eventId);
        return eventMapper.toResponse(updatedEvent);
    }

    /**
     * Removes venue assignment from an event.
     * Only the event organizer can remove a venue.
     *
     * @param eventId the event ID
     * @param username the username of the user attempting to remove
     * @return EventResponse with the updated event
     * @throws EventException if event not found or authorization fails
     */
    @Transactional
    public EventResponse removeVenueFromEvent(Long eventId, String username) {
        log.info("Removing venue from event ID: {} by user: {}", eventId, username);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Authorization
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to modify this event");
        }

        event.setVenue(null);
        Event updatedEvent = eventRepository.save(event);

        log.info("Venue removed successfully from event ID: {}", eventId);
        return eventMapper.toResponse(updatedEvent);
    }

    /**
     * Removes category assignment from an event.
     * Only the event organizer can remove a category.
     *
     * @param eventId the event ID
     * @param username the username of the user attempting to remove
     * @return EventResponse with the updated event
     * @throws EventException if event not found or authorization fails
     */
    @Transactional
    public EventResponse removeCategoryFromEvent(Long eventId, String username) {
        log.info("Removing category from event ID: {} by user: {}", eventId, username);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Authorization
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to modify this event");
        }

        event.setCategory(null);
        Event updatedEvent = eventRepository.save(event);

        log.info("Category removed successfully from event ID: {}", eventId);
        return eventMapper.toResponse(updatedEvent);
    }

    /**
     * Business validation: Ensures end time is after start time and both are in the future.
     *
     * @param startTime the event start time
     * @param endTime the event end time
     * @throws EventException if validation fails
     */
    private void validateEventTimes(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        if (startTime.isBefore(now)) {
            log.error("Event start time is in the past");
            throw new EventException("Event start time must be in the future");
        }

        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            log.error("Event end time is not after start time");
            throw new EventException("Event end time must be after start time");
        }
    }

    /**
     * Checks if an event exists by its ID.
     *
     * @param id the event ID
     * @return true if event exists, false otherwise
     */
    public boolean eventExists(Long id) {
        return eventRepository.existsById(id);
    }

    /**
     * Filters events by city (via venue relationship).
     *
     * @param city the city name
     * @return List of EventResponse for events in that city
     * @throws EventException if city is empty
     */
    public List<EventResponse> filterEventsByCity(String city) {
        log.debug("Filtering events by city: {}", city);

        if (city == null || city.trim().isEmpty()) {
            throw new EventException("City name cannot be empty");
        }

        return eventRepository.findEventsByCity(city).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filters events by date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @return List of EventResponse for events within the date range
     * @throws EventException if dates are invalid
     */
    public List<EventResponse> filterEventsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Filtering events by date range: {} to {}", startDate, endDate);

        if (startDate == null || endDate == null) {
            throw new EventException("Start date and end date cannot be null");
        }

        if (endDate.isBefore(startDate)) {
            throw new EventException("End date must be after start date");
        }

        return eventRepository.findEventsByDateRange(startDate, endDate).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filters events by year and month.
     *
     * @param year the year (e.g., 2025)
     * @param month the month (1-12)
     * @return List of EventResponse for events in that month
     * @throws EventException if year/month are invalid
     */
    public List<EventResponse> filterEventsByMonth(Integer year, Integer month) {
        log.debug("Filtering events by year: {} and month: {}", year, month);

        if (year == null || month == null) {
            throw new EventException("Year and month cannot be null");
        }

        if (month < 1 || month > 12) {
            throw new EventException("Month must be between 1 and 12");
        }

        if (year < 1900 || year > 2100) {
            throw new EventException("Year must be between 1900 and 2100");
        }

        // Calculate first and last day of the month
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        return eventRepository.findEventsByDateRange(startDate, endDate).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Advanced filtering with multiple optional filters.
     * Only filters that are provided (non-null) are applied.
     * If no filters are provided, returns all events.
     *
     * @param filter the EventFilterRequest containing optional filter criteria
     * @return List of EventResponse matching all provided filters
     * @throws EventException if any filter values are invalid
     */
    @Transactional(readOnly = true)
    public List<EventResponse> filterEventsAdvanced(EventFilterRequest filter) {
        log.info("Applying advanced filters: {}", filter);

        // If all filters are null, return all events
        if (isFilterEmpty(filter)) {
            log.debug("No filters provided, returning all events");
            return getAllEvents();
        }

        // Calculate date range if year/month provided
        LocalDateTime startDate = filter.getStartDate();
        LocalDateTime endDate = filter.getEndDate();

        if (filter.getYear() != null && filter.getMonth() != null) {
            YearMonth yearMonth = YearMonth.of(filter.getYear(), filter.getMonth());
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            log.debug("Converted year/month to date range: {} to {}", startDate, endDate);
        }

        // Apply filters based on combination of provided criteria
        List<Event> results = applyFilters(filter, startDate, endDate);

        log.info("Advanced filter returned {} events", results.size());
        return results.stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to determine if EventFilterRequest has any filters set.
     */
    private boolean isFilterEmpty(EventFilterRequest filter) {
        return (filter.getCity() == null || filter.getCity().isEmpty()) &&
                filter.getVenueId() == null &&
                filter.getCategoryId() == null &&
                filter.getOrganizerUsername() == null &&
                filter.getStartDate() == null &&
                filter.getEndDate() == null &&
                filter.getYear() == null &&
                filter.getMonth() == null &&
                filter.getMinCapacity() == null;
    }

    /**
     * Helper method to apply appropriate filters based on what's provided.
     * Implements the logic for combining multiple filters.
     */
    private List<Event> applyFilters(EventFilterRequest filter,
                                     LocalDateTime startDate,
                                     LocalDateTime endDate) {

        boolean hasCity = filter.getCity() != null && !filter.getCity().isEmpty();
        boolean hasCategory = filter.getCategoryId() != null;
        boolean hasVenue = filter.getVenueId() != null;
        boolean hasOrganizerUsername = filter.getOrganizerUsername() != null && !filter.getOrganizerUsername().isEmpty();
        boolean hasDateRange = startDate != null && endDate != null;
        boolean hasMinCapacity = filter.getMinCapacity() != null;

        List<Event> results = new java.util.ArrayList<>();

        // Apply all filters: City + Category + DateRange (most specific)
        if (hasCity && hasCategory && hasDateRange) {
            results = eventRepository.findEventsByCityAndCategoryAndDateRange(
                    filter.getCity(), filter.getCategoryId(), startDate, endDate);
        }
        // Apply City + DateRange
        else if (hasCity && hasDateRange) {
            results = eventRepository.findEventsByCityAndDateRange(
                    filter.getCity(), startDate, endDate);
        }
        // Apply City + Category
        else if (hasCity && hasCategory) {
            results = eventRepository.findEventsByCityAndCategory(
                    filter.getCity(), filter.getCategoryId());
        }
        // Apply Category + DateRange
        else if (hasCategory && hasDateRange) {
            results = eventRepository.findEventsByCategoryAndDateRange(
                    filter.getCategoryId(), startDate, endDate);
        }
        // Apply Venue + DateRange
        else if (hasVenue && hasDateRange) {
            results = eventRepository.findEventsByVenueAndDateRange(
                    filter.getVenueId(), startDate, endDate);
        }
        // Apply only City
        else if (hasCity) {
            results = eventRepository.findEventsByCity(filter.getCity());
        }
        // Apply only Category
        else if (hasCategory) {
            results = eventRepository.findByCategoryId(filter.getCategoryId());
        }
        // Apply only Venue
        else if (hasVenue) {
            results = eventRepository.findByVenueId(filter.getVenueId());
        }
        // Apply only DateRange
        else if (hasDateRange) {
            results = eventRepository.findEventsByDateRange(startDate, endDate);
        }
        // Apply only OrganizerUsername
        else if (hasOrganizerUsername) {
            results = eventRepository.findByOrganizerUsername(filter.getOrganizerUsername());
        }
        // Apply only MinCapacity
        else if (hasMinCapacity) {
            results = eventRepository.findEventsByMinCapacity(filter.getMinCapacity());
        }
        // No valid combination, return all
        else {
            results = eventRepository.findAll();
        }

        // Apply additional client-side filtering if needed
        if (hasOrganizerUsername && !results.isEmpty()) {
            results = results.stream()
                    .filter(e -> e.getOrganizerUsername().equalsIgnoreCase(filter.getOrganizerUsername()))
                    .collect(Collectors.toList());
        }

        if (hasMinCapacity && !results.isEmpty()) {
            results = results.stream()
                    .filter(e -> e.getMaxAttendees() >= filter.getMinCapacity())
                    .collect(Collectors.toList());
        }

        return results;
    }


    /**
     * Search events by keyword in name and description (combined search).
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse matching the keyword
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByNameOrDescription(String keyword) {
        log.info("Searching events by name or description with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByNameOrDescription(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search events by name only.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse matching the name
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByName(String keyword) {
        log.info("Searching events by name with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByName(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search events by description only.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse matching the description
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByDescription(String keyword) {
        log.info("Searching events by description with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByDescription(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search events by venue name.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse at venues matching the name
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByVenueName(String keyword) {
        log.info("Searching events by venue name with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByVenueName(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search events by category name.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse in categories matching the name
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByCategory(String keyword) {
        log.info("Searching events by category name with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByCategory(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search events by organizer username.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse by organizers matching the username
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> searchEventsByOrganizerUsername(String keyword) {
        log.info("Searching events by organizer username with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.searchEventsByOrganizerUsername(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Global search: Search events across all searchable fields.
     * Searches event name, description, venue name, and category name.
     * Case-insensitive, partial match.
     *
     * @param keyword the search keyword
     * @return List of EventResponse matching the keyword in any field
     * @throws EventException if keyword is empty
     */
    public List<EventResponse> globalSearchEvents(String keyword) {
        log.info("Performing global search with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String trimmedKeyword = keyword.trim();

        if (trimmedKeyword.length() > 100) {
            throw new EventException("Search keyword cannot exceed 100 characters");
        }

        return eventRepository.globalSearchEvents(trimmedKeyword).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Advanced search with search type specification.
     * Delegates to appropriate search method based on searchType.
     *
     * @param searchRequest the EventSearchRequest with keyword and searchType
     * @return List of EventResponse based on search type
     * @throws EventException if searchType is invalid
     */
    public List<EventResponse> advancedSearch(EventSearchRequest searchRequest) {
        log.info("Performing advanced search - Type: {}, Keyword: {}",
                searchRequest.getSearchType(), searchRequest.getKeyword());

        if (searchRequest.getKeyword() == null || searchRequest.getKeyword().trim().isEmpty()) {
            throw new EventException("Search keyword cannot be empty");
        }

        String searchType = searchRequest.getSearchType().toLowerCase();
        String keyword = searchRequest.getKeyword().trim();

        switch (searchType) {
            case "name":
                return searchEventsByName(keyword);
            case "description":
                return searchEventsByDescription(keyword);
            case "name_description":
                return searchEventsByNameOrDescription(keyword);
            case "venue":
                return searchEventsByVenueName(keyword);
            case "category":
                return searchEventsByCategory(keyword);
            case "organizer":
                return searchEventsByOrganizerUsername(keyword);
            case "global":
            default:
                return globalSearchEvents(keyword);
        }
    }


}
