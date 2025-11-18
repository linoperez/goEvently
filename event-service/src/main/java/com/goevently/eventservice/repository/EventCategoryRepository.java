package com.goevently.eventservice.repository;

import com.goevently.eventservice.entity.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventCategoryRepository extends JpaRepository<EventCategory, Long> {
    Optional<EventCategory> findByName(String name);
    boolean existsByName(String name);
}
