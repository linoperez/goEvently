package com.goevently.paymentservice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookingDto {
    private Long id;
    private Long userId;
    private Long eventId;
    private Long ticketTierId;
    private Integer seats;
    private String status;
    private String paymentId;
    private BigDecimal totalAmount;
    private String currency;
}