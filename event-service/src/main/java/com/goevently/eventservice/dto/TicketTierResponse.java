package com.goevently.eventservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketTierResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long eventId;
    private String name;
    private BigDecimal price;
    private Integer totalQuantity;
    private Integer remainingQuantity;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
