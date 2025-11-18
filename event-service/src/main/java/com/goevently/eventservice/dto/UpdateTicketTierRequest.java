package com.goevently.eventservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketTierRequest {

    private String name;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;

    @Min(value = 1, message = "Total quantity must be at least 1")
    private Integer totalQuantity;

    private String description;
}
