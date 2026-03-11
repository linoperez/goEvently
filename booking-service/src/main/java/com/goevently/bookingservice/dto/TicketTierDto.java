package com.goevently.bookingservice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TicketTierDto {
    private Long id;
    private Long eventId;
    private String name;
    private BigDecimal price;
    private Integer totalQuantity;
    private Integer remainingQuantity;
    private String description;
}