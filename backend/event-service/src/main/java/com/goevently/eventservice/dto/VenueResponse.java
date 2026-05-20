package com.goevently.eventservice.dto;

import com.goevently.eventservice.entity.VenueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VenueResponse implements Serializable {  // ← ADD THIS
    private static final long serialVersionUID = 1L;  // ← ADD THIS

    private Long id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String country;
    private String zipCode;
    private Integer capacity;
    private String description;
    private VenueStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
