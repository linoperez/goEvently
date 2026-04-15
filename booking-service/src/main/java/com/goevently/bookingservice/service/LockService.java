package com.goevently.bookingservice.service;

import com.goevently.bookingservice.client.EventServiceClient;
import com.goevently.bookingservice.dto.LockRequest;
import com.goevently.bookingservice.dto.LockResponse;
import com.goevently.bookingservice.dto.TierLock;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goevently.bookingservice.entity.LockRecord;
import com.goevently.bookingservice.repository.LockRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class LockService {

    private static final String LOCK_KEY_PREFIX = "lock:";

    private final RedisTemplate<String, Object> redisTemplate;

    private final ObjectMapper objectMapper;

    private final EventServiceClient eventServiceClient;

    private final LockRecordRepository lockRecordRepository;

    @Value("${app.lock.ttl-minutes:5}")
    private long lockTtlMinutes;

    public LockResponse createLock(Long userId, LockRequest request) {

        // Reserve seats in event-service BEFORE creating lock
        try {
            eventServiceClient.reserveQuantity(
                    request.getTicketTierId(),
                    request.getQuantity()
            );
        } catch (Exception e) {
            log.error("Failed to reserve seats for tierId={} quantity={}",
                    request.getTicketTierId(), request.getQuantity(), e);

            throw new RuntimeException("Not enough seats available or reservation failed");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(lockTtlMinutes);
        String lockId = UUID.randomUUID().toString();

        TierLock tierLock = TierLock.builder()
                .lockId(lockId)
                .userId(userId)
                .eventId(request.getEventId())
                .ticketTierId(request.getTicketTierId())
                .quantity(request.getQuantity())
                .createdAt(now)
                .expiresAt(expiresAt)
                .status("LOCKED")
                .build();

        String redisKey = buildLockKey(lockId);
        redisTemplate.opsForValue().set(redisKey, tierLock, lockTtlMinutes, TimeUnit.MINUTES);

        LockRecord record = LockRecord.builder()
                .lockId(lockId)
                .userId(userId)
                .eventId(request.getEventId())
                .ticketTierId(request.getTicketTierId())
                .quantity(request.getQuantity())
                .status("ACTIVE")
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        lockRecordRepository.save(record);

        log.info("Created lock lockId={} userId={} eventId={} tierId={} qty={} expiresAt={}",
                lockId, userId, request.getEventId(), request.getTicketTierId(),
                request.getQuantity(), expiresAt);

        return mapToResponse(tierLock);
    }

    public TierLock getLock(String lockId) {
        Object value = redisTemplate.opsForValue().get(buildLockKey(lockId));

        if (value == null) {
            return null;
        }

        return objectMapper.convertValue(value, TierLock.class);
    }

    public void releaseLock(String lockId) {

        TierLock lock = getLock(lockId);

        if (lock != null) {
            try {
                eventServiceClient.releaseQuantity(
                        lock.getTicketTierId(),
                        lock.getQuantity()
                );
            } catch (Exception e) {
                log.error("Failed to release seats in event-service", e);
            }
        } else {
            // Redis key may already be gone, so use DB record as fallback
            lockRecordRepository.findByLockId(lockId).ifPresent(record -> {
                try {
                    eventServiceClient.releaseQuantity(
                            record.getTicketTierId(),
                            record.getQuantity()
                    );
                } catch (Exception e) {
                    log.error("Failed to release seats from lock record fallback lockId={}", lockId, e);
                }
            });
        }

        Boolean deleted = redisTemplate.delete(buildLockKey(lockId));

        lockRecordRepository.findByLockId(lockId).ifPresent(record -> {
            record.setStatus("RELEASED");
            record.setReleasedAt(LocalDateTime.now());
            lockRecordRepository.save(record);
        });

        log.info("Released lock lockId={} deleted={}", lockId, deleted);
    }

    public void deleteLockOnly(String lockId) {
        Boolean deleted = redisTemplate.delete(buildLockKey(lockId));

        lockRecordRepository.findByLockId(lockId).ifPresent(record -> {
            record.setStatus("COMPLETED");
            record.setReleasedAt(LocalDateTime.now());
            lockRecordRepository.save(record);
        });

        log.info("Deleted lock only lockId={} deleted={}", lockId, deleted);
    }

    public boolean isLockOwnedByUser(String lockId, Long userId) {
        TierLock lock = getLock(lockId);
        return lock != null && lock.getUserId() != null && lock.getUserId().equals(userId);
    }

    private String buildLockKey(String lockId) {
        return LOCK_KEY_PREFIX + lockId;
    }

    private LockResponse mapToResponse(TierLock lock) {
        return LockResponse.builder()
                .lockId(lock.getLockId())
                .userId(lock.getUserId())
                .eventId(lock.getEventId())
                .ticketTierId(lock.getTicketTierId())
                .quantity(lock.getQuantity())
                .createdAt(lock.getCreatedAt())
                .expiresAt(lock.getExpiresAt())
                .status(lock.getStatus())
                .build();
    }
}