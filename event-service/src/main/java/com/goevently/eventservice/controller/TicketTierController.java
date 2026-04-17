package com.goevently.eventservice.controller;

import com.goevently.eventservice.dto.*;
import com.goevently.eventservice.service.TicketTierService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@RestController
@RequestMapping("/api/ticket-tiers")
@Slf4j
public class TicketTierController {

    private final TicketTierService ticketTierService;

    @Autowired
    public TicketTierController(TicketTierService ticketTierService) {
        this.ticketTierService = ticketTierService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<TicketTierResponse>> createTicketTier(
            @Valid @RequestBody CreateTicketTierRequest request) {
        log.info("API Call: Create ticket tier for event ID {}", request.getEventId());
        TicketTierResponse response = ticketTierService.createTier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket tier created successfully", response));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<TicketTierResponse>>> getTiersByEvent(@PathVariable Long eventId) {
        log.info("API Call: Get ticket tiers for event ID {}", eventId);
        List<TicketTierResponse> tiers = ticketTierService.getTiersByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event ticket tiers retrieved", tiers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketTierResponse>> getTierById(@PathVariable Long id) {
        TicketTierResponse tier = ticketTierService.getTicketTierById(id);
        return ResponseEntity.ok(ApiResponse.<TicketTierResponse>builder()
                .success(true)
                .message("Ticket tier retrieved successfully")
                .data(tier)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<TicketTierResponse>> updateTier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketTierRequest request) {
        log.info("API Call: Update ticket tier ID {}", id);
        TicketTierResponse updated = ticketTierService.updateTier(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ticket tier updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<Void>> deleteTier(@PathVariable Long id) {
        log.info("API Call: Delete ticket tier ID {}", id);
        ticketTierService.deleteTier(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket tier deleted successfully"));
    }

    @GetMapping("/event/{eventId}/paginated")
    public ResponseEntity<ApiResponse<PaginatedResponse<TicketTierResponse>>> getTiersByEventPaginated(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        log.info("API Call: Get paginated ticket tiers for event ID {} - page {}, size {}", eventId, page, size);

        PaginatedResponse<TicketTierResponse> paginatedData = ticketTierService.getTiersByEventPaginated(eventId, page, size);

        return ResponseEntity.ok(ApiResponse.paginated("Paginated ticket tiers retrieved successfully", paginatedData));
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<ApiResponse<Void>> reserveQuantity(
            @PathVariable Long id,
            @RequestParam int quantity,
            @RequestHeader(value = "X-Internal-Call", required = false) String internalCall
    ) {
        if (!"true".equalsIgnoreCase(internalCall)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("Forbidden: internal API access only")
                            .build());
        }

        ticketTierService.reserveQuantity(id, quantity);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Quantity reserved successfully")
                .build());
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<ApiResponse<Void>> releaseQuantity(
            @PathVariable Long id,
            @RequestParam int quantity,
            @RequestHeader(value = "X-Internal-Call", required = false) String internalCall
    ) {
        if (!"true".equalsIgnoreCase(internalCall)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("Forbidden: internal API access only")
                            .build());
        }

        ticketTierService.releaseQuantity(id, quantity);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Quantity released successfully")
                .build());
    }



}
