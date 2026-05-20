package com.goevently.eventservice.repository;

import com.goevently.eventservice.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * Find events by organizer username
     */
    List<Event> findByOrganizerUsername(String organizerUsername);

    /**
     * Find events by category
     */
    List<Event> findByCategoryId(Long categoryId);

    /**
     * Find events by venue
     */
    List<Event> findByVenueId(Long venueId);

    /**
     * Find events in a specific city (via venue relationship)
     * Uses JOIN to connect Event with Venue
     */
    @Query("SELECT e FROM Event e JOIN e.venue v WHERE LOWER(v.city) = LOWER(:city)")
    List<Event> findEventsByCity(@Param("city") String city);

    /**
     * Find events within a date range
     */
    @Query("SELECT e FROM Event e WHERE e.startTime >= :startDate AND e.startTime <= :endDate")
    List<Event> findEventsByDateRange(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);

    /**
     * Find events with minimum capacity
     */
    @Query("SELECT e FROM Event e WHERE e.maxAttendees >= :minCapacity")
    List<Event> findEventsByMinCapacity(@Param("minCapacity") Integer minCapacity);

    /**
     * Complex filter: City AND Date Range
     */
    @Query("SELECT e FROM Event e JOIN e.venue v " +
            "WHERE LOWER(v.city) = LOWER(:city) " +
            "AND e.startTime >= :startDate " +
            "AND e.startTime <= :endDate")
    List<Event> findEventsByCityAndDateRange(@Param("city") String city,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    /**
     * Complex filter: City AND Category
     */
    @Query("SELECT e FROM Event e JOIN e.venue v " +
            "WHERE LOWER(v.city) = LOWER(:city) " +
            "AND e.category.id = :categoryId")
    List<Event> findEventsByCityAndCategory(@Param("city") String city,
                                            @Param("categoryId") Long categoryId);

    /**
     * Complex filter: Category AND Date Range
     */
    @Query("SELECT e FROM Event e " +
            "WHERE e.category.id = :categoryId " +
            "AND e.startTime >= :startDate " +
            "AND e.startTime <= :endDate")
    List<Event> findEventsByCategoryAndDateRange(@Param("categoryId") Long categoryId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    /**
     * Complex filter: Venue AND Date Range
     */
    @Query("SELECT e FROM Event e " +
            "WHERE e.venue.id = :venueId " +
            "AND e.startTime >= :startDate " +
            "AND e.startTime <= :endDate")
    List<Event> findEventsByVenueAndDateRange(@Param("venueId") Long venueId,
                                              @Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    /**
     * Ultra-complex filter: City AND Category AND Date Range
     */
    @Query("SELECT e FROM Event e JOIN e.venue v " +
            "WHERE LOWER(v.city) = LOWER(:city) " +
            "AND e.category.id = :categoryId " +
            "AND e.startTime >= :startDate " +
            "AND e.startTime <= :endDate")
    List<Event> findEventsByCityAndCategoryAndDateRange(@Param("city") String city,
                                                        @Param("categoryId") Long categoryId,
                                                        @Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate);


    /**
     * Search events by name (case-insensitive, partial match)
     */
    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByName(@Param("keyword") String keyword);

    /**
     * Search events by description (case-insensitive, partial match)
     */
    @Query("SELECT e FROM Event e WHERE LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByDescription(@Param("keyword") String keyword);

    /**
     * Search events by name OR description (case-insensitive)
     */
    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByNameOrDescription(@Param("keyword") String keyword);

    /**
     * Search events by venue name
     */
    @Query("SELECT e FROM Event e JOIN e.venue v WHERE LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByVenueName(@Param("keyword") String keyword);

    /**
     * Search events by category name
     */
    @Query("SELECT e FROM Event e JOIN e.category c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByCategory(@Param("keyword") String keyword);

    /**
     * Search events by organizer username
     */
    @Query("SELECT e FROM Event e WHERE LOWER(e.organizerUsername) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEventsByOrganizerUsername(@Param("keyword") String keyword);

    /**
     * Global search: Search across name, description, venue name, and category name
     * Returns events matching any of these fields
     */
    @Query("SELECT DISTINCT e FROM Event e " +
            "LEFT JOIN e.venue v " +
            "LEFT JOIN e.category c " +
            "WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> globalSearchEvents(@Param("keyword") String keyword);

}
