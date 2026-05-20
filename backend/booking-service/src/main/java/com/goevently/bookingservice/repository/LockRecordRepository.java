package com.goevently.bookingservice.repository;

import com.goevently.bookingservice.entity.LockRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LockRecordRepository extends JpaRepository<LockRecord, Long> {

    Optional<LockRecord> findByLockId(String lockId);

    List<LockRecord> findByStatusAndExpiresAtBefore(String status, LocalDateTime time);
}