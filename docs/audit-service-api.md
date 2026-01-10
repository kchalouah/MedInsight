# Audit Service API Documentation

## Overview
The Audit Service provides centralized immutable logging for the MedInsight platform. It uses **Elasticsearch** for structured audit trails and **Loki** for application log aggregation.

## Access Roles
- **RESPONSABLE_SECURITE**: Full access to query logs.
- **ADMIN**: Full access to query logs.
- **Microservices**: Can POST logs to the storage endpoint.

## Base URLs

### Access via API Gateway (Recommended)
Base URL: `http://localhost:8080/api`

The Gateway strips the `/api` prefix and forwards to the service.

- Audit: `http://localhost:8080/api/audit/**`

### Direct Access (Development)
Base URL: `http://localhost:8085`

- Audit: `http://localhost:8085/audit/**`

## Endpoints

### 1. Store Audit Log
**Gateway Path:** `POST /api/audit/logs`
**Service Path:** `POST /audit/logs`
**Access:** Open (Internal service use)
**Description:** Record a discrete user action.

**Request Body:**
```json
{
  "serviceName": "appointment-service",
  "userId": "uuid",
  "action": "CREATE_APPOINTMENT",
  "resourceId": "appointment-uuid",
  "status": "SUCCESS",
  "details": "User scheduled an appointment for tomorrow",
  "ipAddress": "192.168.1.1"
}
```

---

### 2. Query All Logs
**Endpoint:** `GET /logs`
**Access:** `ROLE_RESPONSABLE_SECURITE`, `ROLE_ADMIN`
**Description:** Returns all audit logs stored in Elasticsearch.

---

### 3. Query Logs by User
**Endpoint:** `GET /logs/user/{userId}`
**Access:** `ROLE_RESPONSABLE_SECURITE`, `ROLE_ADMIN`

---

### 4. Query Logs by Service
**Endpoint:** `GET /logs/service/{serviceName}`
**Access:** `ROLE_RESPONSABLE_SECURITE`, `ROLE_ADMIN`

## Infrastructure Integration

### Elasticsearch
- Port: `9200`
- Purpose: Permanent, searchable record of business-critical actions.

### Loki
- Port: `3100`
- Purpose: Aggregates `stdout/stderr` from all containers via Logback appenders.
- Configuration: See `logback-spring.xml` in each service.

### Prometheus Metrics
- Endpoint: `/actuator/prometheus`
- Exposes: Log ingestion rates and error counts.
