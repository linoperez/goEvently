# CODEX_PROGRESS

Last updated: 2026-01-19

## Completed so far
- Auth service: registration/login with JWT issuance and role support.
- API Gateway: routes configured for auth/event/booking/payment/notification services; JWT filter exists (not wired).
- Eureka server running for service discovery.
- Event service: CRUD for events, venues, categories, ticket tiers; advanced filtering/search; Redis cache config; Kafka producer for event changes.
- Booking service: basic booking create/read/update status (confirm/cancel/fail); Kafka producer for booking events.
- Payment service: Razorpay order creation/verification (with mock mode); payment CRUD; Kafka producer for payment events.
- Notification service: Kafka listeners for event-created/updated/deleted; writes notifications to DB.

## Services/files we changed
- No code changes were made during this session.
- Reviewed key files for current state:
  - auth-service: `src/main/java/com/goevently/authservice/*`, `src/main/resources/application.yml`
  - api-gateway: `src/main/java/com/goevently/apigateway/*`, `src/main/resources/application.yml`
  - eureka-server: `src/main/resources/application.yml`
  - event-service: `src/main/java/com/goevently/eventservice/*`, `src/main/resources/application.yml`
  - booking-service: `src/main/java/com/goevently/bookingservice/*`, `src/main/resources/application.yml`
  - payment-service: `src/main/java/com/goevently/paymentservice/*`, `src/main/resources/application.yml`
  - notification-service: `src/main/java/com/goevently/notificationservice/*`, `src/main/resources/application.yml`

## Pending (gaps vs plan)
- Seat-level booking flow: seat availability model, seat locking with Redis, lock expiry handling.
- Booking/payment async orchestration: booking-service Kafka consumers for payment-success/failed to update booking status.
- Auth refresh-token + validate-token endpoints.
- API Gateway JWT filter wiring (currently not applied to routes).
- Notification flow for booking/payment events (email/SMS still stubbed).
- Admin/user services are not separate; if staying in auth-service, admin/user endpoints need to be implemented there.

## Next steps (exact tasks)
1) Implement seat availability + locking
   - Add seat/availability entities (event-service or booking-service, based on chosen design).
   - Add endpoints:
     - `GET /api/events/{eventId}/available-seats`
     - `POST /api/events/{eventId}/lock-seats` (Redis lock + TTL)
   - Add lock expiry cleanup (scheduled job or Redis keyspace notifications).
2) Wire payment → booking updates
   - Add Kafka listeners in booking-service for `payment-success` and `payment-failed`.
   - Update booking status and emit booking-confirmed/booking-failed events.
3) Tighten auth + gateway
   - Add `/api/auth/refresh-token` and `/api/auth/validate-token` in auth-service.
   - Apply gateway JWT filter to protected routes (pick YAML or Java route config as source of truth).
4) Notifications for bookings
   - Add Kafka listeners in notification-service for booking/payment events.
   - Implement real email/SMS sending (or keep mock, but structure templates).
