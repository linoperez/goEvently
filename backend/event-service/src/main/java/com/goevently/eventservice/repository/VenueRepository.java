package com.goevently.eventservice.repository;

import com.goevently.eventservice.entity.Venue;
import com.goevently.eventservice.entity.VenueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    List<Venue> findByCity(String city);
    List<Venue> findByStatus(VenueStatus status);
    List<Venue> findByCityAndStatus(String city, VenueStatus status);
}
