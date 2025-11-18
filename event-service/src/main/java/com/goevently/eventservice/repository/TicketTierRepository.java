package com.goevently.eventservice.repository;

import com.goevently.eventservice.entity.TicketTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketTierRepository extends JpaRepository<TicketTier, Long> {

    // ✅ Non-paginated version (existing)
    List<TicketTier> findByEventId(Long eventId);

    // ✅ Paginated version (NEW - add this)
    Page<TicketTier> findByEventId(Long eventId, Pageable pageable);
}
