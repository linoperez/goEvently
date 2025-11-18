package com.goevently.bookingservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    @NotNull(message = "Event ID is required")
    private Long eventId;

    @Min(value = 1, message = "Seats must be at least 1")
    private Integer seats = 1;
}
