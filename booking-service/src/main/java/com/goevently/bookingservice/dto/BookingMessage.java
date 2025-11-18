package com.goevently.bookingservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMessage {
    private Long id;
    private Long userId;
    private Long eventId;
    private String status;
    private Integer seats;
    private String paymentId;
    private LocalDateTime bookingTime;
}
