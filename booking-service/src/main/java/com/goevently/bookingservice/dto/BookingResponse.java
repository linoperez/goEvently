package com.goevently.bookingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private Long userId;
    private Long eventId;
    private String status;
    private Integer seats;
    private String paymentId;
    private String txnRef;
    private LocalDateTime bookingTime;
    private LocalDateTime createdAt;
}
