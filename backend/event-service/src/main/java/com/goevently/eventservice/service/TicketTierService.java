package com.goevently.eventservice.service;

import com.goevently.eventservice.dto.CreateTicketTierRequest;
import com.goevently.eventservice.dto.PaginatedResponse;
import com.goevently.eventservice.dto.TicketTierResponse;
import com.goevently.eventservice.dto.UpdateTicketTierRequest;
import com.goevently.eventservice.entity.Event;
import com.goevently.eventservice.entity.TicketTier;
import com.goevently.eventservice.exception.EventException;
import com.goevently.eventservice.repository.EventRepository;
import com.goevently.eventservice.repository.TicketTierRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TicketTierService {

    private final TicketTierRepository ticketTierRepository;
    private final EventRepository eventRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    public TicketTierService(TicketTierRepository ticketTierRepository, EventRepository eventRepository) {
        this.ticketTierRepository = ticketTierRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public TicketTierResponse createTier(CreateTicketTierRequest request, String username) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new EventException("Event not found with ID: " + request.getEventId()));

        validateEventOwner(event, username);

        TicketTier tier = new TicketTier();
        tier.setEvent(event);
        tier.setName(request.getName());
        tier.setPrice(request.getPrice());
        tier.setTotalQuantity(request.getTotalQuantity());
        tier.setRemainingQuantity(request.getTotalQuantity());
        tier.setDescription(request.getDescription());

        TicketTier savedTier = ticketTierRepository.save(tier);

        TicketTierResponse response = mapToResponse(savedTier);

        kafkaProducerService.sendTicketTierCreated(response);

        log.info(
                "Created new ticket tier '{}' for event '{}' by user '{}'",
                savedTier.getName(),
                event.getName(),
                username
        );

        return response;
    }

    public List<TicketTierResponse> getTiersByEvent(Long eventId) {
        return ticketTierRepository.findByEventId(eventId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketTierResponse updateTier(Long id, UpdateTicketTierRequest request, String username) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));

        validateTierOwner(tier, username);

        if (request.getName() != null) {
            tier.setName(request.getName());
        }

        if (request.getPrice() != null) {
            tier.setPrice(request.getPrice());
        }

        if (request.getTotalQuantity() != null) {
            int diff = request.getTotalQuantity() - tier.getTotalQuantity();
            tier.setTotalQuantity(request.getTotalQuantity());
            tier.setRemainingQuantity(Math.max(0, tier.getRemainingQuantity() + diff));
        }

        if (request.getDescription() != null) {
            tier.setDescription(request.getDescription());
        }

        TicketTier updated = ticketTierRepository.save(tier);

        log.info("Updated ticket tier '{}' by user '{}'", updated.getName(), username);

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteTier(Long id, String username) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));

        validateTierOwner(tier, username);

        ticketTierRepository.delete(tier);

        log.info("Deleted ticket tier '{}' by user '{}'", tier.getName(), username);
    }

    @Transactional
    public void reserveQuantity(Long tierId, int quantity) {
        TicketTier tier = ticketTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Ticket tier not found"));

        if (tier.getRemainingQuantity() < quantity) {
            throw new RuntimeException("Not enough seats available");
        }

        tier.setRemainingQuantity(tier.getRemainingQuantity() - quantity);
        ticketTierRepository.save(tier);
    }

    @Transactional
    public void releaseQuantity(Long tierId, int quantity) {
        TicketTier tier = ticketTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Ticket tier not found"));

        tier.setRemainingQuantity(tier.getRemainingQuantity() + quantity);
        ticketTierRepository.save(tier);
    }

    public PaginatedResponse<TicketTierResponse> getTiersByEventPaginated(Long eventId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TicketTier> tierPage = ticketTierRepository.findByEventId(eventId, pageable);

        List<TicketTierResponse> content = tierPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<TicketTierResponse>builder()
                .content(content)
                .page(tierPage.getNumber())
                .size(tierPage.getSize())
                .totalElements(tierPage.getTotalElements())
                .totalPages(tierPage.getTotalPages())
                .last(tierPage.isLast())
                .build();
    }

    public TicketTierResponse getTicketTierById(Long id) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));

        return mapToResponse(tier);
    }

    private void validateTierOwner(TicketTier tier, String username) {
        if (tier.getEvent() == null) {
            throw new EventException("Ticket tier is not linked to a valid event");
        }

        validateEventOwner(tier.getEvent(), username);
    }

    private void validateEventOwner(Event event, String username) {
        if (event.getOrganizerUsername() == null || username == null) {
            throw new EventException("You are not authorized to modify ticket tiers for this event");
        }

        if (!event.getOrganizerUsername().equalsIgnoreCase(username)) {
            log.warn(
                    "Unauthorized ticket tier modification attempt. Event ID: {}, Event owner: {}, Request user: {}",
                    event.getId(),
                    event.getOrganizerUsername(),
                    username
            );

            throw new EventException("You are not authorized to modify ticket tiers for this event");
        }
    }


    private TicketTierResponse mapToResponse(TicketTier tier) {
        TicketTierResponse response = new TicketTierResponse();
        response.setId(tier.getId());
        response.setEventId(tier.getEvent() != null ? tier.getEvent().getId() : null);
        response.setName(tier.getName());
        response.setPrice(tier.getPrice());
        response.setTotalQuantity(tier.getTotalQuantity());
        response.setRemainingQuantity(tier.getRemainingQuantity());
        response.setDescription(tier.getDescription());
        response.setCreatedAt(tier.getCreatedAt());
        response.setUpdatedAt(tier.getUpdatedAt());
        return response;
    }
}