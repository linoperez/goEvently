# GoEvently - Complete Project State Documentation

**Date:** October 21, 2025  
**Status:** Week 6 Complete, Starting Week 7  
**Developer:** Swayam  
**Project:** Event Management Microservices Platform

---

## 📋 Executive Summary

This document provides complete context for continuing the GoEvently project. It includes all implementation details, code structures, problems encountered and solved, testing results, and the exact next steps.

**Current Status:**
- ✅ **Completed:** Auth Service, Event Service, API Gateway, Eureka Server, Complete Testing (45+ tests)
- ⏳ **In Progress:** None (ready for Week 7)
- ❌ **Not Started:** Ticket Tiers, Kafka, Frontend, Seating Plans

**Timeline Position:** Completed Weeks 1-6, Ready for Week 7

---

## 🎯 Project Overview

### **Project Name:** GoEvently
### **Type:** Event Management Platform
### **Architecture:** Spring Boot Microservices
### **Duration:** 3-month learning project
### **Current Week:** Starting Week 7

### **High-Level Goals:**
1. Build production-grade microservices architecture
2. Implement JWT authentication and role-based authorization
3. Create event management system with booking capabilities
4. Learn asynchronous communication (Kafka)
5. Build React frontend
6. Deploy to cloud (future)

### **Technology Stack:**
- **Backend:** Java 17, Spring Boot 3.4.3, Spring Cloud 2024.0.0
- **Database:** MySQL 8.0.39
- **Security:** JWT (jsonwebtoken 0.11.5), Spring Security, BCrypt
- **Service Discovery:** Netflix Eureka
- **API Gateway:** Spring Cloud Gateway
- **Build Tool:** Maven
- **IDE:** IntelliJ IDEA Ultimate 2023.1.3
- **Testing:** Postman
- **Future:** Apache Kafka, React, Docker, Kubernetes

---

## 🏗️ System Architecture

```
Client (Postman/Frontend)
    ↓
API Gateway (Port 8080)
    ├─→ Auth Service (Port 8081) → MySQL (auth_service_db)
    └─→ Event Service (Port 8082) → MySQL (event_service_db)
    ↓
Eureka Server (Port 8761)
```

### **Communication Flow:**
1. All requests go through API Gateway (8080)
2. Gateway discovers services via Eureka
3. Gateway routes requests based on URL patterns:
   - `/api/auth/**` → auth-service
   - `/api/events/**` → event-service
4. Services validate JWT tokens
5. Services perform business logic
6. Services return standardized responses

---

## 📁 Project Structure

```
D:\Java\springboot\goevently\backend\
│
├── eureka-server/
│   ├── src/main/java/com/goevently/eurekaserver/
│   │   └── EurekaServerApplication.java
│   └── src/main/resources/
│       └── application.yml
│
├── api-gateway/
│   ├── src/main/java/com/goevently/apigateway/
│   │   ├── ApiGatewayApplication.java
│   │   └── exception/
│   │       └── GlobalExceptionHandler.java
│   └── src/main/resources/
│       └── application.yml
│
├── auth-service/
│   ├── src/main/java/com/goevently/authservice/
│   │   ├── AuthServiceApplication.java
│   │   ├── controller/
│   │   │   └── AuthController.java
│   │   ├── dto/
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   └── AuthResponse.java
│   │   ├── entity/
│   │   │   └── User.java
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── service/
│   │   │   └── AuthService.java
│   │   ├── security/
│   │   │   ├── SecurityConfig.java
│   │   │   └── JwtService.java
│   │   └── exception/
│   │       ├── AuthException.java
│   │       └── GlobalExceptionHandler.java
│   └── src/main/resources/
│       └── application.yml
│
└── event-service/
    ├── src/main/java/com/goevently/eventservice/
    │   ├── EventServiceApplication.java
    │   ├── controller/
    │   │   └── EventController.java
    │   ├── dto/
    │   │   ├── CreateEventRequest.java
    │   │   ├── UpdateEventRequest.java
    │   │   ├── EventResponse.java
    │   │   └── ApiResponse.java
    │   ├── entity/
    │   │   └── Event.java
    │   ├── repository/
    │   │   └── EventRepository.java
    │   ├── service/
    │   │   └── EventService.java
    │   ├── filter/
    │   │   └── JwtAuthFilter.java
    │   ├── security/
    │   │   ├── SecurityConfig.java
    │   │   └── JwtService.java
    │   ├── util/
    │   │   └── EventMapper.java
    │   └── exception/
    │       ├── EventException.java
    │       └── GlobalExceptionHandler.java
    └── src/main/resources/
        └── application.yml
```

---

## 🔧 Service Details

### **1. Eureka Server (Port 8761)**

**Purpose:** Service registry and discovery

**Main Class:**
```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

**Configuration (application.yml):**
```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: true
```

**Status:** ✅ Working perfectly
**Dashboard:** http://localhost:8761

---

### **2. API Gateway (Port 8080)**

**Purpose:** Single entry point, routing, load balancing

**Main Class:**
```java
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

**Configuration (application.yml):**
```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**
          
        - id: event-service
          uri: lb://event-service
          predicates:
            - Path=/api/events/**

eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
```

**Global Exception Handler:**
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFoundException(NotFoundException e) {
        log.error("Gateway error: ", e);
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Service unavailable or not found");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("Unexpected error: ", e);
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

**Status:** ✅ Working perfectly
**Key Feature:** Jackson datetime module added for proper JSON serialization

---

### **3. Auth Service (Port 8081)**

**Purpose:** User authentication, registration, JWT token generation

#### **Database Configuration:**
- **Database Name:** `goevently_auth_db`
- **Table:** `users`
- **Connection:** `jdbc:mysql://localhost:3306/goevently_auth_db`

#### **Users Table Schema:**
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### **User Entity:**
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### **Role Enum:**
```java
public enum Role {
    USER,
    ORGANIZER,
    ADMIN
}
```

#### **DTOs:**

**RegisterRequest:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role cannot be null")
    private Role role;
}
```

**LoginRequest:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username cannot be blank")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    private String password;
}
```

**AuthResponse:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private boolean success;
    private String message;
    private String jwt;
    private Long userId;
    private String username;
    private String email;
    private Role role;
}
```

#### **JWT Service:**
```java
@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    @Value("${jwt.expiration}")
    private long JWT_EXPIRATION;

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = SECRET_KEY.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

#### **Auth Service Implementation:**
```java
@Service
@Slf4j
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthException("Username already exists");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String jwt = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully")
                .jwt(jwt)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthException("Invalid username or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid username or password");
        }

        // Generate JWT token
        String jwt = jwtService.generateToken(user);

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .jwt(jwt)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
```

#### **Security Configuration:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

#### **Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

#### **Configuration (application.yml):**
```yaml
server:
  port: 8081

spring:
  application:
    name: auth-service
  datasource:
    url: jdbc:mysql://localhost:3306/goevently_auth_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: Sw@yam107
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true

eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true

jwt:
  secret: myGoEventlySecretKeyThatIsLongEnoughForHS256Algorithm
  expiration: 36000000

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized

logging:
  level:
    com.goevently.authservice: INFO
    org.springframework.security: WARN
```

**Status:** ✅ Fully working and tested
**Test Users Created:**
- john_organizer (ORGANIZER)
- sarah_organizer (ORGANIZER)
- mike_user (USER)
- admin_user (ADMIN)

---

### **4. Event Service (Port 8082)**

**Purpose:** Event CRUD operations, authorization, validation

#### **Database Configuration:**
- **Database Name:** `event_service_db`
- **Table:** `events`
- **Connection:** `jdbc:mysql://localhost:3306/event_service_db`

#### **Events Table Schema:**
```sql
CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    location VARCHAR(200) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_attendees INT NOT NULL,
    organizer_username VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### **Event Entity:**
```java
@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "max_attendees", nullable = false)
    private Integer maxAttendees;

    @Column(name = "organizer_username", nullable = false, length = 50)
    private String organizerUsername;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### **DTOs:**

**CreateEventRequest:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {
    @NotBlank(message = "Event name cannot be blank")
    @Size(min = 3, max = 100, message = "Event name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Event description cannot be blank")
    @Size(min = 10, max = 1000, message = "Event description must be between 10 and 1000 characters")
    private String description;

    @NotBlank(message = "Event location cannot be blank")
    @Size(min = 5, max = 200, message = "Event location must be between 5 and 200 characters")
    private String location;

    @NotNull(message = "Start time cannot be null")
    @Future(message = "Event start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time cannot be null")
    private LocalDateTime endTime;

    @NotNull(message = "Max attendees cannot be null")
    @Min(value = 1, message = "Max attendees must be at least 1")
    @Max(value = 100000, message = "Max attendees cannot exceed 100,000")
    private Integer maxAttendees;
}
```

**UpdateEventRequest:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRequest {
    @Size(min = 3, max = 100, message = "Event name must be between 3 and 100 characters")
    private String name;

    @Size(min = 10, max = 1000, message = "Event description must be between 10 and 1000 characters")
    private String description;

    @Size(min = 5, max = 200, message = "Event location must be between 5 and 200 characters")
    private String location;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Min(value = 1, message = "Max attendees must be at least 1")
    @Max(value = 100000, message = "Max attendees cannot exceed 100,000")
    private Integer maxAttendees;
}
```

**EventResponse & ApiResponse:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String name;
    private String description;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxAttendees;
    private String organizerUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
```

#### **JWT Auth Filter:**
```java
@Component
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = authHeader.substring(7);
            String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.validateToken(jwt)) {
                    String role = jwtService.extractClaim(jwt, claims -> claims.get("role", String.class));
                    Long userId = jwtService.extractClaim(jwt, claims -> claims.get("userId", Long.class));

                    List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                    
                    authToken.setDetails(Map.of("userId", userId, "role", role));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            log.error("JWT validation error: ", e);
        }

        filterChain.doFilter(request, response);
    }
}
```

#### **Event Service Implementation:**
```java
@Service
@Slf4j
public class EventService {
    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventMapper eventMapper;

    public EventResponse createEvent(CreateEventRequest request, String organizerUsername) {
        // Validate end time after start time
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new EventException("Event end time must be after start time");
        }

        // Validate start time is in future
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new EventException("Event start time must be in the future");
        }

        Event event = eventMapper.toEntity(request);
        event.setOrganizerUsername(organizerUsername);

        Event savedEvent = eventRepository.save(event);
        log.info("Event created with ID: {}", savedEvent.getId());

        return eventMapper.toResponse(savedEvent);
    }

    public EventResponse updateEvent(Long eventId, UpdateEventRequest request, String username) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Check ownership
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to update this event");
        }

        // Validate if provided
        if (request.getStartTime() != null && request.getEndTime() != null) {
            if (request.getEndTime().isBefore(request.getStartTime())) {
                throw new EventException("Event end time must be after start time");
            }
        }

        // Update only non-null fields
        if (request.getName() != null) event.setName(request.getName());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getLocation() != null) event.setLocation(request.getLocation());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getMaxAttendees() != null) event.setMaxAttendees(request.getMaxAttendees());

        Event updatedEvent = eventRepository.save(event);
        log.info("Event updated: {}", eventId);

        return eventMapper.toResponse(updatedEvent);
    }

    public void deleteEvent(Long eventId, String username) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));

        // Check ownership
        if (!event.getOrganizerUsername().equals(username)) {
            throw new EventException("You are not authorized to delete this event");
        }

        eventRepository.delete(event);
        log.info("Event deleted: {}", eventId);
    }

    public EventResponse getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException("Event not found with ID: " + eventId));
        return eventMapper.toResponse(event);
    }

    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getEventsByOrganizer(String organizerUsername) {
        return eventRepository.findByOrganizerUsername(organizerUsername).stream()
                .map(eventMapper::toResponse)
                .collect(Collectors.toList());
    }
}
```

#### **Event Controller:**
```java
@RestController
@RequestMapping("/api/events")
@Slf4j
public class EventController {
    @Autowired
    private EventService eventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        EventResponse event = eventService.createEvent(request, username);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event created successfully")
                .data(event)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable Long id) {
        EventResponse event = eventService.getEventById(id);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event retrieved successfully")
                .data(event)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents();

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/organizer/{username}")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByOrganizer(
            @PathVariable String username) {
        
        List<EventResponse> events = eventService.getEventsByOrganizer(username);

        ApiResponse<List<EventResponse>> response = ApiResponse.<List<EventResponse>>builder()
                .success(true)
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        EventResponse event = eventService.updateEvent(id, request, username);

        ApiResponse<EventResponse> response = ApiResponse.<EventResponse>builder()
                .success(true)
                .message("Event updated successfully")
                .data(event)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        eventService.deleteEvent(id, username);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Event deleted successfully")
                .build();

        return ResponseEntity.ok(response);
    }
}
```

#### **Security Configuration:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

#### **Global Exception Handler:**
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthorizationDenied(AuthorizationDeniedException e) {
        log.warn("Authorization denied: {}", e.getMessage());

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message("Access denied. You do not have permission to perform this action.")
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(EventException.class)
    public ResponseEntity<ApiResponse<Object>> handleEventException(EventException e) {
        log.error("Event error: {}", e.getMessage());

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message(e.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(errors)
                .build();

        log.error("Validation failed: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception e) {
        log.error("Unexpected error: ", e);

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message("An unexpected error occurred")
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

#### **Configuration (application.yml):**
```yaml
server:
  port: 8082

spring:
  application:
    name: event-service
  datasource:
    url: jdbc:mysql://localhost:3306/event_service_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: Sw@yam107
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true

eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true

jwt:
  secret: myGoEventlySecretKeyThatIsLongEnoughForHS256Algorithm
  expiration: 36000000

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized

logging:
  level:
    com.goevently.eventservice: INFO
    org.springframework.security: WARN
```

**Status:** ✅ Fully working and tested (45+ test cases passed)

---

## 🧪 Testing Results

### **Testing Framework:** Manual testing via Postman

### **Test Summary:**
- **Total Tests:** 45+
- **Passed:** 45+
- **Failed:** 0
- **Status:** ✅ All tests passed

### **Phase 1: User Registration (4 tests)** ✅
- ✅ Register ORGANIZER (john_organizer)
- ✅ Register ORGANIZER (sarah_organizer)
- ✅ Register USER (mike_user)
- ✅ Register ADMIN (admin_user)

**JWT Tokens Generated Successfully**

### **Phase 2: Event Creation (4 tests)** ✅
- ✅ John creates event #1 (Spring Boot Workshop)
- ✅ Sarah creates event #2 (React Workshop)
- ✅ Admin creates event #3 (DevOps Workshop)
- ✅ USER role denied (403 Forbidden - correct behavior)

### **Phase 3: Validation Testing (7 tests)** ✅
- ✅ Name too short (< 3 chars) - 400 Bad Request
- ✅ Missing required fields - 400 Bad Request
- ✅ End time before start time - 400 Bad Request
- ✅ Start time in past - 400 Bad Request
- ✅ Max attendees too high (> 100k) - 400 Bad Request
- ✅ Max attendees too low (< 1) - 400 Bad Request
- ✅ Blank description - 400 Bad Request

### **Phase 4: Read Operations (8 tests)** ✅
- ✅ Get event by ID (exists) - 200 OK
- ✅ Get event by ID (doesn't exist) - 400 Bad Request
- ✅ Get all events - 200 OK (returns 3 events)
- ✅ Get events by organizer (john) - 200 OK (1 event)
- ✅ Get events by organizer (sarah) - 200 OK (1 event)
- ✅ Get events by non-existent organizer - 200 OK (empty array)
- ✅ Access without token - 403 Forbidden (expected)

### **Phase 5: Update Operations (8 tests)** ✅
- ✅ Update own event (partial) - 200 OK
- ✅ Try to update another's event - 400 Bad Request
- ✅ USER role cannot update - 403 Forbidden
- ✅ Update multiple fields - 200 OK
- ✅ Update with invalid name - 400 Bad Request
- ✅ Update with invalid attendees - 400 Bad Request
- ✅ Update non-existent event - 400 Bad Request
- ✅ Update with empty body - 200 OK (only timestamp updated)

### **Phase 6: Delete Operations (10 tests)** ✅
- ✅ Try to delete another's event - 400 Bad Request
- ✅ USER role cannot delete - 403 Forbidden
- ✅ Delete non-existent event - 400 Bad Request
- ✅ Delete own event successfully - 200 OK
- ✅ Verify deletion with GET - 400 Bad Request (not found)
- ✅ Verify not in list - 200 OK (only 2 events)
- ✅ Try to delete already deleted - 400 Bad Request
- ✅ Sarah deletes her event - 200 OK
- ✅ Admin deletes their event - 200 OK
- ✅ Verify all deleted - 200 OK (empty array)

---

## 🐛 Problems Encountered & Solutions

### **Problem 1: Auth-Service Not Registering with Eureka**
**Symptom:** Auth-service showing as "EVENT-SERVICE" in Eureka  
**Root Cause:** IntelliJ run configuration had wrong classpath including both services  
**Solution:** 
1. Deleted all IntelliJ run configurations
2. Found auth-service pom.xml had dependency on event-service
3. Removed the dependency
4. Fixed GlobalExceptionHandler importing wrong package
5. Ran via Maven CLI: `mvn spring-boot:run`

### **Problem 2: Database Column Missing**
**Symptom:** `Unknown column 'created_at' in 'field list'`  
**Root Cause:** Database table didn't have audit timestamp columns  
**Solution:** Added `created_at` and `updated_at` columns to events table

### **Problem 3: 500 Error for Authorization Denial**
**Symptom:** USER role getting 500 instead of 403 when creating events  
**Root Cause:** No specific handler for AuthorizationDeniedException  
**Solution:** Added exception handler returning 403 Forbidden

### **Problem 4: Validation Not Working**
**Symptom:** Event with 2-character name was accepted  
**Root Cause:** Missing `@Valid` annotation on controller method parameters  
**Solution:** Added `@Valid` before `@RequestBody` in all controller methods

### **Problem 5: Jackson DateTime Serialization**
**Symptom:** Java 8 date/time type not supported by default  
**Root Cause:** Missing Jackson JSR310 module  
**Solution:** Added dependency (already present in Spring Boot starter)

### **Problem 6: 403 Instead of 401 for Missing Token**
**Symptom:** Getting 403 Forbidden instead of 401 Unauthorized when no token provided  
**Root Cause:** Spring Security default behavior  
**Decision:** Left as-is (acceptable behavior, security works correctly)

### **Problem 7: Empty Update Body Succeeds**
**Symptom:** Update with `{}` returns 200 OK  
**Analysis:** This is correct REST behavior for partial updates  
**Decision:** Left as-is (follows industry standards)

---

## 📝 Key Design Decisions

### **1. JWT Token Structure**
**Decision:** Include `username`, `userId`, and `role` in claims  
**Reasoning:** Allows services to extract user info without calling auth-service

### **2. Separate Databases per Service**
**Decision:** Each microservice has own database  
**Reasoning:** Follows microservices best practices, enables independent scaling

### **3. Shared JWT Secret**
**Decision:** Same JWT secret across all services  
**Reasoning:** Simplifies token validation, acceptable for monolithic deployment

### **4. Role-Based Authorization**
**Decision:** Three roles (USER, ORGANIZER, ADMIN)  
**Reasoning:** Clear separation of capabilities
- USER: Can view events
- ORGANIZER: Can create/manage events
- ADMIN: Can create/manage events

### **5. Ownership Validation**
**Decision:** Users can only update/delete their own events  
**Reasoning:** Prevents unauthorized modifications even with correct role

### **6. Partial Updates**
**Decision:** Allow updating only specified fields  
**Reasoning:** Flexible API, follows REST best practices

### **7. @PreAuthorize on Methods**
**Decision:** Use method-level security annotations  
**Reasoning:** Clear, declarative, easy to understand and maintain

### **8. Centralized Exception Handling**
**Decision:** GlobalExceptionHandler in each service  
**Reasoning:** Consistent error responses, clean code

### **9. DTOs for Requests/Responses**
**Decision:** Separate DTOs from entities  
**Reasoning:** Decouples API from database, allows validation

### **10. Non-Null JSON Fields**
**Decision:** Omit null fields in responses  
**Reasoning:** Cleaner JSON, smaller payload size

---

## 🔐 Security Implementation

### **Authentication Flow:**
1. User registers/logs in via auth-service
2. Auth-service returns JWT token with user info
3. Client includes token in `Authorization: Bearer <token>` header
4. Event-service validates token via JwtAuthFilter
5. User information extracted and set in SecurityContext
6. Controller methods check roles via @PreAuthorize
7. Service methods check ownership for update/delete

### **Password Security:**
- BCrypt hashing (auto-salted, slow by design)
- Never store plain text passwords
- Password strength validation (min 6 characters)

### **Token Security:**
- 10-hour expiration
- HMAC SHA-256 signing
- Secret key configuration via properties
- Stateless (no server-side session)

### **Authorization Layers:**
- **Layer 1:** Authentication (JWT validation)
- **Layer 2:** Role-based (USER/ORGANIZER/ADMIN)
- **Layer 3:** Ownership (can only modify own events)

---

## 🗂️ POM Dependencies

### **Parent POM (backend/pom.xml):**
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.3</version>
</parent>

<properties>
    <java.version>17</java.version>
    <spring-cloud.version>2024.0.0</spring-cloud.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### **Auth-Service Dependencies:**
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>jakarta.validation</groupId>
        <artifactId>jakarta.validation-api</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

### **Event-Service Dependencies:**
(Same as Auth-Service plus)
```xml
<dependency>
    <groupId>org.hibernate.validator</groupId>
    <artifactId>hibernate-validator</artifactId>
</dependency>
```

---

## 🎯 Week 7 Requirements (To Do Next)

### **✅ Completed:**
- Event CRUD backend

### **❌ To Do:**

#### **1. Ticket Tiers (Backend) - Priority 1**
**Entity:**
```java
@Entity
@Table(name = "ticket_tiers")
public class TicketTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;
    
    private String name; // VIP, Regular, Student
    private String description;
    private BigDecimal price;
    private Integer totalSeats;
    private Integer availableSeats;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**Tasks:**
- Create TicketTier entity
- Add @OneToMany relationship in Event
- Create TicketTierRepository
- Create TicketTierService
- Create TicketTierController
- Implement CRUD endpoints
- Update event creation to include ticket tiers
- Test thoroughly

#### **2. Apache Kafka Setup - Priority 2**
**Installation:**
1. Download Kafka from https://kafka.apache.org/downloads
2. Extract to suitable location
3. Start Zookeeper (or use Kraft mode)
4. Start Kafka broker

**Topics to Create:**
```bash
kafka-topics.sh --create --topic event-creation-topic --bootstrap-server localhost:9092
kafka-topics.sh --create --topic event-update-topic --bootstrap-server localhost:9092
kafka-topics.sh --create --topic event-deletion-topic --bootstrap-server localhost:9092
```

**Tasks:**
- Install and run Kafka locally
- Add spring-kafka dependency
- Create KafkaProducerConfig
- Create EventProducer service
- Publish events on create/update/delete
- Create simple consumer for testing
- Test event-driven communication

#### **3. Frontend (React) - Priority 3**
**Setup:**
```bash
npx create-react-app goevently-frontend
cd goevently-frontend
npm install react-router-dom axios
```

**Components to Build:**
- EventDetailPage.jsx
- EventList.jsx
- Login.jsx
- Register.jsx
- CreateEvent.jsx

**Tasks:**
- Setup React project
- Implement routing
- Create EventDetailPage
- Fetch and display event details
- Handle authentication
- Display ticket tiers

#### **4. Seating Plan Visualization - Priority 4 (Optional)**
**Tasks:**
- Add seatingPlanConfig JSON field to Event
- Create SeatMap.jsx component
- Implement visual seat layout
- Color code by availability/tier
- Make interactive (future: seat selection)

---

## 🚀 How to Run the System

### **Prerequisites:**
- Java 17
- Maven
- MySQL 8.0
- IntelliJ IDEA (or any IDE)
- Postman (for testing)

### **Database Setup:**
```sql
-- Create databases
CREATE DATABASE goevently_auth_db;
CREATE DATABASE event_service_db;

-- Tables will be auto-created by Spring Boot (ddl-auto: update)
```

### **Start Services (in this order):**

**1. Start Eureka Server:**
```bash
cd eureka-server
mvn spring-boot:run
```
Verify at: http://localhost:8761

**2. Start Auth Service:**
```bash
cd auth-service
mvn spring-boot:run
```
Check logs for: "Registering application AUTH-SERVICE"

**3. Start Event Service:**
```bash
cd event-service
mvn spring-boot:run
```
Check logs for: "Registering application EVENT-SERVICE"

**4. Start API Gateway:**
```bash
cd api-gateway
mvn spring-boot:run
```
Check logs for: "Registering application API-GATEWAY"

**5. Verify in Eureka Dashboard:**
Go to http://localhost:8761 and confirm all services are UP

### **Testing with Postman:**

**Register a user:**
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "role": "ORGANIZER"
}
```

**Copy the JWT token from response**

**Create an event:**
```
POST http://localhost:8080/api/events
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Test Event",
  "description": "Testing event creation",
  "location": "Test Location",
  "startTime": "2025-12-01T10:00:00",
  "endTime": "2025-12-01T17:00:00",
  "maxAttendees": 100
}
```

---

## 📚 Learning Resources & References

### **Spring Boot:**
- https://spring.io/projects/spring-boot
- https://docs.spring.io/spring-boot/docs/current/reference/html/

### **Spring Cloud:**
- https://spring.io/projects/spring-cloud
- https://cloud.spring.io/spring-cloud-netflix/reference/html/

### **JWT:**
- https://jwt.io/
- https://github.com/jwtk/jjwt

### **Microservices:**
- https://microservices.io/patterns/microservices.html

### **Kafka:**
- https://kafka.apache.org/documentation/

---

## 🎓 Lessons Learned

1. **Service Discovery is Crucial:** Eureka makes service-to-service communication dynamic and resilient

2. **JWT Simplifies Auth:** Stateless authentication allows easy scaling

3. **Validation is Essential:** Never trust client input, validate everything

4. **Exception Handling Matters:** Consistent error responses improve API usability

5. **Testing is Time-Consuming but Necessary:** 45+ tests caught many edge cases

6. **IntelliJ Can Be Tricky:** Run configurations can cause classpath issues

7. **Database Schema Matters:** Auto-create is good for dev, but know your schema

8. **Security Layers:** Multiple layers (auth, role, ownership) provide defense in depth

9. **DTOs vs Entities:** Separation allows flexibility and security

10. **Documentation is Key:** This document proves comprehensive docs save time

---

## 🔄 Next Steps

### **Immediate (Week 7):**
1. ✅ Implement Ticket Tiers backend
2. ✅ Setup Kafka and publish events
3. ✅ Test async communication

### **Short Term (Week 8-9):**
4. Create Attendance/Booking Service
5. Implement booking with ticket tier selection
6. Add payment processing (mock)

### **Medium Term (Week 10-12):**
7. Build React frontend
8. Implement user dashboard
9. Add admin panel

### **Long Term (Future):**
10. Docker containerization
11. Kubernetes deployment
12. CI/CD pipeline
13. Cloud deployment (AWS/Azure)
14. Mobile app

---

## 📞 Current State Summary

**Developer:** Swayam  
**Project Path:** `D:\Java\springboot\goevently\backend\`  
**Database Password:** `Sw@yam107`  
**JWT Secret:** `myGoEventlySecretKeyThatIsLongEnoughForHS256Algorithm`  
**JWT Expiration:** 10 hours (36000000 ms)

**Services Status:**
- ✅ Eureka Server: Running on 8761
- ✅ Auth Service: Running on 8081, registered as AUTH-SERVICE
- ✅ Event Service: Running on 8082, registered as EVENT-SERVICE
- ✅ API Gateway: Running on 8080, routing correctly

**Test Users:**
- john_organizer (ORGANIZER) - Has JWT token
- sarah_organizer (ORGANIZER) - Has JWT token
- mike_user (USER) - Has JWT token
- admin_user (ADMIN) - Has JWT token

**Current Events:** None (all deleted during testing)

**Ready For:** Week 7 implementation (Ticket Tiers & Kafka)

---

## 💡 Quick Start for New Chat

**To continue this project in a new chat, share this document and say:**

> "I'm working on the GoEvently project. I've attached the complete project state document. I've completed Weeks 1-6 (Auth Service, Event Service, API Gateway, Eureka, Full Testing). I'm ready to start Week 7: Ticket Tiers and Kafka Setup. Please review the document and help me continue."

---

**End of Documentation**

This document contains everything needed to continue the GoEvently project without any context loss. All code, configurations, problems solved, and next steps are documented in detail.
