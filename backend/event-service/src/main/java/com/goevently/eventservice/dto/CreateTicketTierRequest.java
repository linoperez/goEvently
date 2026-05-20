package com.goevently.eventservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketTierRequest {

    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotBlank(message = "Tier name cannot be blank")
    private String name;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;

    @NotNull(message = "Total quantity cannot be null")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer totalQuantity;

    private String description;
}
