# Gateway Service API Documentation

## Overview

The Gateway Service is the central entry point for all client requests to the MedInsight backend. It provides routing, security, and load balancing for all microservices.

## Base URL

```
http://localhost:8080
```

## Architecture

The gateway uses Spring Cloud Gateway to route requests to backend microservices discovered via Eureka. All requests are validated for JWT authentication (except public endpoints).

---

## Routing

### Route Configuration

| Path Pattern | Target Service | Description |
|-------------|----------------|-------------|
| `/api/auth/**` | auth-service | Authentication and registration |
| `/api/admin/**` | auth-service | Admin operations |
| `/api/patients/**` | patient-service | Patient management |
| `/api/doctors/**` | doctor-service | Doctor management |
| `/api/appointments/**` | appointment-service | Appointment scheduling |

### Load Balancing

The gateway uses the `lb://` URI scheme to load balance requests across multiple instances of each service registered with Eureka.

---

## Security

### Authentication

All requests (except public endpoints) require a valid JWT token from Keycloak.

**Header Format**:
```
Authorization: Bearer <jwt_token>
```

### Public Endpoints

The following endpoints are accessible without authentication:

- `POST /api/auth/register/patient`
- `POST /api/auth/register/medecin`
- `GET /swagger-ui.html`
- `GET /v3/api-docs/**`
- `GET /actuator/health`

### Protected Endpoints

All other endpoints require:
1. Valid JWT token
2. Appropriate role (ADMIN, PATIENT, MEDECIN, etc.)

### Role-Based Access

The gateway extracts roles from JWT tokens and enforces role-based access:

- **Admin endpoints** (`/api/admin/**`): Require `ROLE_ADMIN`
- **Patient endpoints** (`/api/patients/**`): Require `ROLE_PATIENT` or `ROLE_ADMIN`
- **Doctor endpoints** (`/api/doctors/**`): Require `ROLE_MEDECIN` or `ROLE_ADMIN`

---

## CORS Configuration

### Allowed Origins

- `http://localhost:3000` (React frontend)
- `http://localhost:8080` (Gateway itself)

### Allowed Methods

- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

### Allowed Headers

All headers (`*`)

### Credentials

Credentials are allowed (`Access-Control-Allow-Credentials: true`)

---

## API Documentation

### Swagger UI

**Endpoint**: `GET /swagger-ui.html`

**Description**: Interactive API documentation aggregating all microservices.

**Access**: Public (no authentication required)

**URL**: http://localhost:8080/swagger-ui.html

---

### OpenAPI Specification

**Endpoint**: `GET /v3/api-docs`

**Description**: OpenAPI 3.0 specification in JSON format.

**Access**: Public

**URL**: http://localhost:8080/v3/api-docs

---

## Actuator Endpoints

### Health Check

**Endpoint**: `GET /actuator/health`

**Description**: Check gateway health status.

**Access**: Public

**Response**: `200 OK`

```json
{
  "status": "UP"
}
```

---

### Gateway Routes

**Endpoint**: `GET /actuator/gateway/routes`

**Description**: List all configured routes.

**Access**: Requires authentication

**Response**: `200 OK`

```json
[
  {
    "route_id": "auth-route",
    "route_definition": {
      "id": "auth-route",
      "predicates": [
        {
          "name": "Path",
          "args": {
            "_genkey_0": "/api/auth/**",
            "_genkey_1": "/api/admin/**"
          }
        }
      ],
      "uri": "lb://auth-service"
    },
    "order": 0
  }
]
```

---

## Request Flow

### 1. Client Request

```
Client → Gateway (http://localhost:8080/api/patients)
```

### 2. JWT Validation

Gateway validates JWT token:
- Checks signature with Keycloak JWK
- Validates expiration
- Extracts roles from `realm_access.roles`

### 3. Route Matching

Gateway matches request path to configured routes:
- `/api/patients/**` → `lb://patient-service`

### 4. Service Discovery

Gateway queries Eureka for available instances of `patient-service`

### 5. Load Balancing

Gateway selects an instance using round-robin load balancing

### 6. Request Forwarding

```
Gateway → Patient Service (http://patient-service:8082/api/patients)
```

### 7. Response

```
Patient Service → Gateway → Client
```

---

## Error Responses

### 401 Unauthorized

**Cause**: Missing or invalid JWT token

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/patients",
  "status": 401,
  "timestamp": "2026-01-09T00:00:00Z"
}
```

---

### 403 Forbidden

**Cause**: Valid token but insufficient permissions

**Response**:
```json
{
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/admin/users",
  "status": 403,
  "timestamp": "2026-01-09T00:00:00Z"
}
```

---

### 404 Not Found

**Cause**: No route matches the request path

**Response**:
```json
{
  "error": "Not Found",
  "message": "No matching route found",
  "path": "/api/unknown",
  "status": 404,
  "timestamp": "2026-01-09T00:00:00Z"
}
```

---

### 503 Service Unavailable

**Cause**: Target service is not available in Eureka

**Response**:
```json
{
  "error": "Service Unavailable",
  "message": "Unable to find instance for patient-service",
  "path": "/api/patients",
  "status": 503,
  "timestamp": "2026-01-09T00:00:00Z"
}
```

---

## Example Requests

### Get JWT Token from Keycloak

```bash
curl -X POST http://localhost:8180/realms/medinsight/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=medinsight-gateway" \
  -d "client_secret=gateway-secret" \
  -d "grant_type=password" \
  -d "username=patient@example.com" \
  -d "password=SecurePass123!"
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

---

### Access Protected Endpoint

```bash
curl -X GET http://localhost:8080/api/patients \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Register New Patient (Public)

```bash
curl -X POST http://localhost:8080/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newpatient@example.com",
    "password": "SecurePass123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1995-05-15",
    "gender": "FEMALE"
  }'
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | Eureka server URL | `http://discovery-service:8761/eureka/` |
| `SECURITY_OAUTH2_ISSUER_URI` | Keycloak issuer URI | `http://keycloak:8080/realms/medinsight` |
| `SECURITY_OAUTH2_JWK_SET_URI` | Keycloak JWK set URI | `http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs` |

---

## Monitoring

### Health Check

```bash
curl http://localhost:8080/actuator/health
```

### View Routes

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/actuator/gateway/routes
```

### Refresh Routes

```bash
curl -X POST http://localhost:8080/actuator/gateway/refresh
```

---

## Best Practices

1. **Always Use HTTPS in Production**: Configure SSL/TLS certificates
2. **Implement Rate Limiting**: Protect against DDoS attacks
3. **Enable Circuit Breakers**: Handle service failures gracefully
4. **Monitor Gateway Metrics**: Track request rates, latencies, and errors
5. **Use Correlation IDs**: Track requests across services
6. **Configure Timeouts**: Set appropriate timeouts for backend services

---

## Summary

The Gateway Service provides:
- ✅ Centralized API entry point
- ✅ JWT authentication and authorization
- ✅ Dynamic routing via service discovery
- ✅ Load balancing across service instances
- ✅ CORS configuration for frontend
- ✅ Aggregated API documentation
- ✅ Health monitoring and metrics
