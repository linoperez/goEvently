package com.goevently.bookingservice.repository;

import com.goevently.bookingservice.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find bookings by user ID
    Page<Booking> findByUserId(Long userId, Pageable pageable);

    // Find bookings by event ID
    Page<Booking> findByEventId(Long eventId, Pageable pageable);

    // Find bookings by event ID and status
    List<Booking> findByEventIdAndStatus(Long eventId, String status);

    // Find booking by user and event
    Optional<Booking> findByUserIdAndEventId(Long userId, Long eventId);

    // Count confirmed bookings for an event
    Long countByEventIdAndStatus(Long eventId, String status);
}
