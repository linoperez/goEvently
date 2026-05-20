package com.goevently.eventservice.service;

import com.goevently.eventservice.dto.CreateVenueRequest;
import com.goevently.eventservice.dto.UpdateVenueRequest;
import com.goevently.eventservice.dto.VenueResponse;
import com.goevently.eventservice.entity.Venue;
import com.goevently.eventservice.entity.VenueStatus;
import com.goevently.eventservice.exception.EventException;
import com.goevently.eventservice.repository.VenueRepository;
import com.goevently.eventservice.util.VenueMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

/**
 * Service layer for handling venue-related business logic.
 * Contains methods for creating, retrieving, updating, and managing venues.
 */
@Service
@Slf4j
public class VenueService {

    private final VenueRepository venueRepository;
    private final VenueMapper venueMapper;

    @Autowired
    public VenueService(VenueRepository venueRepository, VenueMapper venueMapper) {
        this.venueRepository = venueRepository;
        this.venueMapper = venueMapper;
    }

    /**
     * Creates a new venue with business validation.
     *
     * @param request the CreateVenueRequest containing venue details
     * @return VenueResponse with the created venue data
     * @throws EventException if validation fails
     */

    @CacheEvict(value = { "venues-getAll", "venues-active" }, allEntries = true)
    @Transactional
    public VenueResponse createVenue(CreateVenueRequest request) {
        log.info("Creating venue: {} in city: {}", request.getName(), request.getCity());

        // Business validation
        validateVenueData(request);

        // Create venue entity from request
        Venue venue = new Venue();
        venue.setName(request.getName());
        venue.setAddress(request.getAddress());
        venue.setCity(request.getCity());
        venue.setState(request.getState());
        venue.setCountry(request.getCountry());
        venue.setZipCode(request.getZipCode());
        venue.setCapacity(request.getCapacity());
        venue.setDescription(request.getDescription());
        venue.setStatus(request.getStatus() != null ? request.getStatus() : VenueStatus.ACTIVE);

        // Save venue
        Venue savedVenue = venueRepository.save(venue);
        log.info("Venue created successfully with ID: {}", savedVenue.getId());

        return venueMapper.toResponse(savedVenue);
    }

    /**
     * Retrieves a venue by its unique ID.
     *
     * @param id the venue ID
     * @return VenueResponse containing venue details
     * @throws EventException if venue not found
     */
    public VenueResponse getVenueById(Long id) {
        log.debug("Fetching venue with ID: {}", id);

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Venue not found with ID: {}", id);
                    return new EventException("Venue not found with ID: " + id);
                });

        return venueMapper.toResponse(venue);
    }

    /**
     * Retrieves all venues from the database.
     *
     * @return List of VenueResponse containing all venues
     */

    @Cacheable(value = "venues-getAll")
    public List<VenueResponse> getAllVenues() {
        log.debug("Fetching all venues");

        return venueRepository.findAll().stream()
                .map(venueMapper::toResponse)
                .collect(Collectors.toList());
    }
    /**
     * Retrieves all active venues.
     *
     * @return List of VenueResponse containing only active venues
     */

    @Cacheable(value = "venues-active")
    public List<VenueResponse> getActiveVenues() {
        log.debug("Fetching all active venues");

        return venueRepository.findByStatus(VenueStatus.ACTIVE).stream()
                .map(venueMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all venues in a specific city.
     *
     * @param city the city name
     * @return List of VenueResponse containing venues in the specified city
     */
    public List<VenueResponse> getVenuesByCity(String city) {
        log.debug("Fetching venues in city: {}", city);

        if (city == null || city.trim().isEmpty()) {
            throw new EventException("City name cannot be empty");
        }

        return venueRepository.findByCity(city).stream()
                .map(venueMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all venues in a specific city with active status.
     *
     * @param city the city name
     * @return List of VenueResponse containing active venues in the specified city
     */
    public List<VenueResponse> getActiveVenuesByCity(String city) {
        log.debug("Fetching active venues in city: {}", city);

        if (city == null || city.trim().isEmpty()) {
            throw new EventException("City name cannot be empty");
        }

        return venueRepository.findByCityAndStatus(city, VenueStatus.ACTIVE).stream()
                .map(venueMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing venue.
     * Only non-null fields in the request will be updated.
     *
     * @param id the venue ID
     * @param request the UpdateVenueRequest containing updated venue details
     * @return VenueResponse with the updated venue data
     * @throws EventException if venue not found or validation fails
     */

    @CacheEvict(value = { "venues-getAll", "venues-active" }, allEntries = true)
    @Transactional
    public VenueResponse updateVenue(Long id, UpdateVenueRequest request) {
        log.info("Updating venue ID: {}", id);

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Venue not found with ID: {}", id);
                    return new EventException("Venue not found with ID: " + id);
                });

        // Validate updated data if provided
        if (request.getCapacity() != null && request.getCapacity() < 1) {
            throw new EventException("Venue capacity must be at least 1");
        }

        // Update only non-null fields
        if (request.getName() != null) {
            venue.setName(request.getName());
        }
        if (request.getAddress() != null) {
            venue.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            venue.setCity(request.getCity());
        }
        if (request.getState() != null) {
            venue.setState(request.getState());
        }
        if (request.getCountry() != null) {
            venue.setCountry(request.getCountry());
        }
        if (request.getZipCode() != null) {
            venue.setZipCode(request.getZipCode());
        }
        if (request.getCapacity() != null) {
            venue.setCapacity(request.getCapacity());
        }
        if (request.getDescription() != null) {
            venue.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            venue.setStatus(request.getStatus());
        }

        // Save updated venue
        Venue updatedVenue = venueRepository.save(venue);
        log.info("Venue updated successfully: {}", updatedVenue.getId());

        return venueMapper.toResponse(updatedVenue);
    }

    /**
     * Deletes a venue by its ID.
     *
     * @param id the venue ID
     * @throws EventException if venue not found
     */

    @CacheEvict(value = { "venues-getAll", "venues-active" }, allEntries = true)
    @Transactional
    public void deleteVenue(Long id) {
        log.info("Deleting venue ID: {}", id);

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Venue not found with ID: {}", id);
                    return new EventException("Venue not found with ID: " + id);
                });

        venueRepository.delete(venue);
        log.info("Venue deleted successfully: {}", id);
    }

    /**
     * Changes the status of a venue.
     *
     * @param id the venue ID
     * @param status the new VenueStatus
     * @return VenueResponse with updated venue
     * @throws EventException if venue not found
     */
    @Transactional
    public VenueResponse updateVenueStatus(Long id, VenueStatus status) {
        log.info("Updating venue status for ID: {} to {}", id, status);

        if (status == null) {
            throw new EventException("Venue status cannot be null");
        }

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Venue not found with ID: {}", id);
                    return new EventException("Venue not found with ID: " + id);
                });

        venue.setStatus(status);
        Venue updatedVenue = venueRepository.save(venue);

        log.info("Venue status updated successfully for ID: {}", id);

        return venueMapper.toResponse(updatedVenue);
    }

    /**
     * Validates venue data for creation.
     *
     * @param request the CreateVenueRequest to validate
     * @throws EventException if validation fails
     */
    private void validateVenueData(CreateVenueRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new EventException("Venue name cannot be empty");
        }

        if (request.getAddress() == null || request.getAddress().trim().isEmpty()) {
            throw new EventException("Venue address cannot be empty");
        }

        if (request.getCity() == null || request.getCity().trim().isEmpty()) {
            throw new EventException("Venue city cannot be empty");
        }

        if (request.getState() == null || request.getState().trim().isEmpty()) {
            throw new EventException("Venue state cannot be empty");
        }

        if (request.getCountry() == null || request.getCountry().trim().isEmpty()) {
            throw new EventException("Venue country cannot be empty");
        }

        if (request.getCapacity() == null || request.getCapacity() < 1) {
            throw new EventException("Venue capacity must be at least 1");
        }

        // Validate field lengths
        if (request.getName().length() < 3) {
            throw new EventException("Venue name must be at least 3 characters");
        }

        if (request.getAddress().length() < 5) {
            throw new EventException("Venue address must be at least 5 characters");
        }

        // Additional business rules
        if (request.getCapacity() > 1000000) {
            throw new EventException("Venue capacity cannot exceed 1,000,000");
        }

        log.debug("Venue data validation passed for: {}", request.getName());
    }

    /**
     * Checks if a venue exists by its ID.
     *
     * @param id the venue ID
     * @return true if venue exists, false otherwise
     */
    public boolean venueExists(Long id) {
        return venueRepository.existsById(id);
    }
}
