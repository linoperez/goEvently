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

    @NotNull(message = "Ticket Tier ID is required")
    private Long ticketTierId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Backward compatibility (old request body used "seats")
    @Min(value = 1, message = "Seats must be at least 1")
    private Integer seats;

    /**
     * Use quantity if present, else fallback to seats, else default 1.
     */
    public int resolvedQuantity() {
        if (quantity != null) return quantity;
        if (seats != null) return seats;
        return 1;
    }
}
