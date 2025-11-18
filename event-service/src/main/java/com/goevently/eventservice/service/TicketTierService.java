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
import com.goevently.eventservice.util.TicketTierMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@Slf4j
public class TicketTierService {

    private final TicketTierRepository ticketTierRepository;
    private final EventRepository eventRepository;
    private final TicketTierMapper ticketTierMapper;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    public TicketTierService(TicketTierRepository ticketTierRepository, EventRepository eventRepository, TicketTierMapper ticketTierMapper) {
        this.ticketTierRepository = ticketTierRepository;
        this.eventRepository = eventRepository;
        this.ticketTierMapper = ticketTierMapper;
    }

    @Transactional
    public TicketTierResponse createTier(CreateTicketTierRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new EventException("Event not found with ID: " + request.getEventId()));

        TicketTier tier = ticketTierMapper.toEntity(request, event);
        TicketTier savedTier = ticketTierRepository.save(tier);


        TicketTierResponse response = ticketTierMapper.toResponse(savedTier);

        // NEW: Send Kafka message
        kafkaProducerService.sendTicketTierCreated(response);

        log.info("Created new ticket tier '{}' for event '{}'", savedTier.getName(), event.getName());

        return response;
    }

    public List<TicketTierResponse> getTiersByEvent(Long eventId) {
        return ticketTierRepository.findByEventId(eventId)
                .stream()
                .map(ticketTierMapper::toResponse)
                .collect(Collectors.toList());
    }

    public TicketTierResponse getTierById(Long id) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));
        return ticketTierMapper.toResponse(tier);
    }

    @Transactional
    public TicketTierResponse updateTier(Long id, UpdateTicketTierRequest request) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));

        if (request.getName() != null) tier.setName(request.getName());
        if (request.getPrice() != null) tier.setPrice(request.getPrice());
        if (request.getTotalQuantity() != null) {
            int diff = request.getTotalQuantity() - tier.getTotalQuantity();
            tier.setTotalQuantity(request.getTotalQuantity());
            tier.setRemainingQuantity(Math.max(0, tier.getRemainingQuantity() + diff));
        }
        if (request.getDescription() != null) tier.setDescription(request.getDescription());

        TicketTier updated = ticketTierRepository.save(tier);
        log.info("Updated ticket tier '{}'", updated.getName());
        return ticketTierMapper.toResponse(updated);
    }

    @Transactional
    public void deleteTier(Long id) {
        TicketTier tier = ticketTierRepository.findById(id)
                .orElseThrow(() -> new EventException("Ticket tier not found with ID: " + id));
        ticketTierRepository.delete(tier);
        log.info("Deleted ticket tier '{}'", tier.getName());
    }


    public PaginatedResponse<TicketTierResponse> getTiersByEventPaginated(Long eventId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TicketTier> tierPage = ticketTierRepository.findByEventId(eventId, pageable);

        List<TicketTierResponse> content = tierPage.getContent().stream()
                .map(ticketTierMapper::toResponse)
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
}
