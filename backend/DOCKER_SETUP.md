# goEvently Backend Docker Setup

This guide explains how to run the goEvently backend microservices locally using Docker Compose.

The Docker setup is intended for local development, testing, and DevOps demonstration. It runs the backend services, MySQL, Kafka, Zookeeper, Eureka Server, and API Gateway together.

---

## 1. Services Included

The Docker Compose setup runs the following containers:

| Service | Container Name | Port |
|---|---:|---:|
| Eureka Server | `eureka-goevently` | `8761` |
| API Gateway | `gateway-goevently` | `8080` |
| Auth Service | `auth-goevently` | `8081` |
| Event Service | `event-goevently` | `8082` |
| Notification Service | `notification-goevently` | `8083` |
| Booking Service | `booking-goevently` | `8084` |
| Payment Service | `payment-goevently` | `8085` |
| MySQL | `mysql-goevently` | `3307:3306` |
| Kafka | `kafka-goevently` | `9094:9092` |
| Zookeeper | `zookeeper-goevently` | `2181` |

Inside Docker, services communicate using container/service names, for example:

```text
mysql:3306
kafka:29092
eureka-server:8761
```

From the Windows host machine, Docker MySQL and Kafka are exposed as:

```text
localhost:3307
localhost:9094
```

---

## 2. Prerequisites

Install and start the following before running the backend stack:

- Docker Desktop
- Docker Compose plugin
- Java/Maven only if building outside Docker

Before running commands, make sure Docker Desktop is open and the Docker Engine is running.

Verify Docker:

```powershell
docker version
docker compose version
```

Both commands should return valid version information.

---

## 3. Required Files

The backend root folder should contain:

```text
backend/
├── .env
├── .env.example
├── docker-compose.yml
├── pom.xml
├── api-gateway/
├── auth-service/
├── booking-service/
├── event-service/
├── notification-service/
├── payment-service/
├── eureka-server/
└── init-scripts/
```

The `.env` file must be placed in the same folder as `docker-compose.yml`.

---

## 4. Environment Configuration

Create a local `.env` file inside the backend root folder.

Example:

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_USER=goevently
MYSQL_PASSWORD=goevently123

AUTH_DB=auth_db
EVENT_DB=event_db
BOOKING_DB=booking_db
PAYMENT_DB=payment_db
NOTIFICATION_DB=notification_db

JWT_SECRET=myGoEventlySecretKeyThatIsLongEnoughForHS256Algorithm

EUREKA_PORT=8761
API_GATEWAY_PORT=8080
AUTH_SERVICE_PORT=8081
EVENT_SERVICE_PORT=8082
NOTIFICATION_SERVICE_PORT=8083
BOOKING_SERVICE_PORT=8084
PAYMENT_SERVICE_PORT=8085

KAFKA_EXTERNAL_PORT=9094
ZOOKEEPER_PORT=2181
```

Do not commit `.env` to GitHub.

Commit only `.env.example` with dummy placeholder values.

---

## 5. Git Ignore Rules

The project root `.gitignore` should ignore the real local environment file:

```gitignore
.env
.env.local
.env.*.local
backend/.env
```

The `.env.example` file should remain tracked because it helps other developers set up the project.

---

## 6. Running the Backend Stack

Open PowerShell or terminal inside the backend root folder:

```powershell
cd F:\D\Java\springboot\goevently\backend
```

Validate the Docker Compose file:

```powershell
docker compose config
```

Build the backend images:

```powershell
docker compose build
```

Start all services:

```powershell
docker compose up
```

To start in detached/background mode:

```powershell
docker compose up -d
```

---

## 7. Verifying the Setup

Check running containers:

```powershell
docker compose ps
```

Open Eureka dashboard:

```text
http://localhost:8761
```

The following services should appear in Eureka:

```text
API-GATEWAY
AUTH-SERVICE
EVENT-SERVICE
BOOKING-SERVICE
PAYMENT-SERVICE
NOTIFICATION-SERVICE
```

Test API Gateway:

```text
http://localhost:8080/api/events
```

A successful response may look like this:

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "content": [],
    "empty": true
  }
}
```

An empty event list is normal when Docker MySQL is newly initialized.

---

## 8. Why `http://localhost:8080/` May Show an Error

Opening the API Gateway root URL:

```text
http://localhost:8080/
```

may return an error like:

```json
{
  "status": 500,
  "message": "Gateway error: 404 NOT_FOUND \"No static resource .\"",
  "path": "/"
}
```

This is expected because the API Gateway does not serve a homepage at `/`.

Use actual API routes such as:

```text
http://localhost:8080/api/events
```

---

## 9. Stopping Services

To stop all running containers safely:

```powershell
docker compose down
```

This stops containers but keeps the MySQL Docker volume.

To stop containers and delete Docker volumes/data:

```powershell
docker compose down -v
```

Use `-v` only when you intentionally want to reset Docker MySQL data.

---

## 10. Viewing Logs

View logs for all services:

```powershell
docker compose logs -f
```

View logs for a specific service:

```powershell
docker compose logs -f api-gateway
```

Other examples:

```powershell
docker compose logs -f event-service
docker compose logs -f auth-service
docker compose logs -f kafka
```

---

## 11. Common Issues and Fixes

### Issue: Docker engine not running

Error:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Fix:

- Open Docker Desktop.
- Wait until Docker Engine is running.
- Run:

```powershell
docker version
```

Both Client and Server details should appear.

---

### Issue: MySQL port 3306 already in use

Error:

```text
ports are not available: exposing port TCP 0.0.0.0:3306
```

Fix:

Use host port `3307` for Docker MySQL:

```yaml
ports:
  - "3307:3306"
```

Backend containers still use:

```text
mysql:3306
```

From Windows host, connect using:

```text
localhost:3307
```

---

### Issue: Kafka port 9092 already in use

Error:

```text
ports are not available: exposing port TCP 0.0.0.0:9092
```

Fix:

Set this in `.env`:

```env
KAFKA_EXTERNAL_PORT=9094
```

Docker services still use:

```text
kafka:29092
```

From Windows host, use:

```text
localhost:9094
```

---

### Issue: Kafka container unhealthy

Possible reason:

The healthcheck is checking the wrong listener.

The Kafka healthcheck should use the internal Docker listener:

```yaml
healthcheck:
  test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server kafka:29092 >/dev/null 2>&1 || exit 1"]
  interval: 15s
  timeout: 10s
  retries: 20
  start_period: 40s
```

---

### Issue: Empty events list

If `/api/events` returns an empty list, it usually means Docker MySQL is fresh and has no event data yet.

This is normal.

You can create new events through the application or add seed SQL later inside `init-scripts`.

---

## 12. Useful Commands

Validate Compose file:

```powershell
docker compose config
```

Build images:

```powershell
docker compose build
```

Start services:

```powershell
docker compose up
```

Start services in background:

```powershell
docker compose up -d
```

Check running containers:

```powershell
docker compose ps
```

Stop services:

```powershell
docker compose down
```

Stop services and remove volumes:

```powershell
docker compose down -v
```

View logs:

```powershell
docker compose logs -f
```

Rebuild a specific service:

```powershell
docker compose build api-gateway
```

Restart a specific service:

```powershell
docker compose restart api-gateway
```

---

## 13. Current DevOps Status

Completed:

- Backend services run using Docker Compose.
- MySQL runs in Docker.
- Kafka and Zookeeper run in Docker.
- Eureka discovery works.
- API Gateway routes requests to backend services.
- Environment variables are separated using `.env`.
- Local secret values are kept out of Git.

Next planned steps:

1. Add final Docker Compose polish for local demo.
2. Deploy frontend on Vercel.
3. Deploy backend services on Railway.
4. Use Railway MySQL for cloud deployment.
5. Keep Kafka local-only initially or make Kafka optional for cloud demo.
