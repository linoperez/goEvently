package com.goevently.authservice.repository;

import com.goevently.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username.
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a user by their email.
     */
    Optional<User> findByEmail(String email);

    /**
     * ✅ NEW: Finds a user by username OR email.
     * This method allows login with either credential.
     */
    Optional<User> findByUsernameOrEmail(String username, String email);
}
