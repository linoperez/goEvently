package com.goevently.bookingservice.service;

import com.goevently.bookingservice.entity.LockRecord;
import com.goevently.bookingservice.repository.LockRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LockExpiryScheduler {

    private final LockRecordRepository lockRecordRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final LockService lockService;

    @Scheduled(fixedDelayString = "${app.lock.cleanup-interval-ms:60000}")
    public void cleanupExpiredLocks() {
        LocalDateTime now = LocalDateTime.now();

        List<LockRecord> expiredLocks =
                lockRecordRepository.findByStatusAndExpiresAtBefore("ACTIVE", now);

        if (expiredLocks.isEmpty()) {
            return;
        }

        log.info("Found {} expired active locks to process", expiredLocks.size());

        for (LockRecord record : expiredLocks) {
            String redisKey = "lock:" + record.getLockId();
            Boolean exists = redisTemplate.hasKey(redisKey);

            // Only auto-release if Redis lock is truly gone
            if (Boolean.FALSE.equals(exists)) {
                try {
                    lockService.releaseLock(record.getLockId());

                    record.setStatus("EXPIRED");
                    record.setReleasedAt(LocalDateTime.now());
                    lockRecordRepository.save(record);

                    log.info("Expired lock auto-released lockId={}", record.getLockId());
                } catch (Exception e) {
                    log.error("Failed to auto-release expired lock lockId={}", record.getLockId(), e);
                }
            }
        }
    }
}