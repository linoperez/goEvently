package com.goevently.paymentservice.client;

import com.goevently.paymentservice.dto.ApiResponse;
import com.goevently.paymentservice.dto.BookingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "booking-service")
public interface BookingServiceClient {

    @GetMapping("/api/bookings/internal/{id}")
    ApiResponse<BookingDto> getBookingById(@PathVariable("id") Long id);
}