package com.goevently.bookingservice.client;

import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.TicketTierDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "event-service")
public interface EventServiceClient {

    @GetMapping("/api/ticket-tiers/{id}")
    ApiResponse<TicketTierDto> getTicketTierById(@PathVariable("id") Long id);

    @PostMapping("/api/ticket-tiers/{id}/reserve")
    ApiResponse<Void> reserveQuantity(
            @PathVariable("id") Long tierId,
            @RequestParam("quantity") int quantity,
            @RequestHeader("X-Internal-Call") String internalCall,
            @RequestHeader("X-Internal-Secret") String internalSecret
    );

    @PostMapping("/api/ticket-tiers/{id}/release")
    ApiResponse<Void> releaseQuantity(
            @PathVariable("id") Long tierId,
            @RequestParam("quantity") int quantity,
            @RequestHeader("X-Internal-Call") String internalCall,
            @RequestHeader("X-Internal-Secret") String internalSecret
    );
}