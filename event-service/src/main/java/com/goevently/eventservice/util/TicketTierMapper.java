package com.goevently.eventservice.util;

import com.goevently.eventservice.dto.CreateTicketTierRequest;
import com.goevently.eventservice.dto.TicketTierResponse;
import com.goevently.eventservice.entity.Event;
import com.goevently.eventservice.entity.TicketTier;
import org.springframework.stereotype.Component;

@Component
public class TicketTierMapper {

    public TicketTier toEntity(CreateTicketTierRequest request, Event event) {
        TicketTier tier = new TicketTier();
        tier.setEvent(event);
        tier.setName(request.getName());
        tier.setPrice(request.getPrice());
        tier.setTotalQuantity(request.getTotalQuantity());
        tier.setRemainingQuantity(request.getTotalQuantity());
        tier.setDescription(request.getDescription());
        return tier;
    }

    public TicketTierResponse toResponse(TicketTier tier) {
        return TicketTierResponse.builder()
                .id(tier.getId())
                .eventId(tier.getEvent().getId())
                .name(tier.getName())
                .price(tier.getPrice())
                .totalQuantity(tier.getTotalQuantity())
                .remainingQuantity(tier.getRemainingQuantity())
                .description(tier.getDescription())
                .createdAt(tier.getCreatedAt())
                .updatedAt(tier.getUpdatedAt())
                .build();
    }
}
