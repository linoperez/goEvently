package com.goevently.bookingservice.client;

import com.goevently.bookingservice.dto.ApiResponse;
import com.goevently.bookingservice.dto.TicketTierDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "event-service")
public interface EventServiceClient {

    @GetMapping("/api/ticket-tiers/{id}")
    ApiResponse<TicketTierDto> getTicketTierById(@PathVariable("id") Long id);
}