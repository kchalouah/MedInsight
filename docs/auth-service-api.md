# Auth Service API Documentation

## Overview

The Auth Service is responsible for user authentication, registration, and management in the MedInsight E-Health Platform. It integrates with Keycloak for authentication and provides REST APIs for user registration and administration.

## Base URL

```
http://localhost:8081
```

### Access via API Gateway (Recommended)
Base URL: `http://localhost:8080/api`

The Gateway strips the `/api` prefix and forwards to the service.

- Auth registration/login: `http://localhost:8080/api/auth/**`
- Admin operations: `http://localhost:8080/api/admin/**`

### Direct Access (Development)
Base URL: `http://localhost:8081`

- Auth: `http://localhost:8081/auth/**`
- Admin: `http://localhost:8081/admin/**`

## Authentication

Most endpoints require JWT authentication via Keycloak. Include the Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Roles

The system supports 5 roles:

| Role | Description | Creation Method |
|------|-------------|-----------------|
| `ADMIN` | System administrator | Manual (Keycloak) |
| `PATIENT` | Patient user | Self-registration |
| `MEDECIN` | Doctor/physician | Self-registration |
| `GESTIONNAIRE` | Manager | Admin-created only |
| `RESPONSABLE_SECURITE` | Security officer | Admin-created only |

---

## Public Endpoints

### Register Patient
**Gateway Path:** `POST /api/auth/register/patient`
**Service Path:** `POST /auth/register/patient`

**Access:** Public (no authentication required)

**Description:** Allows patients to self-register in the system.

**Request Body:**

```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "addressLine": "123 Main St",
  "city": "New York",
  "country": "USA",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "bloodType": "O+",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+1234567891",
  "insuranceProvider": "HealthCare Inc",
  "insuranceNumber": "INS123456"
}
```

**Response:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "keycloakId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "patient@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "addressLine": "123 Main St",
  "city": "New York",
  "country": "USA",
  "enabled": true,
  "createdAt": "2026-01-09T00:00:00",
  "updatedAt": "2026-01-09T00:00:00",
  "patientProfile": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "bloodType": "O+",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+1234567891",
    "insuranceProvider": "HealthCare Inc",
    "insuranceNumber": "INS123456"
  },
  "medecinProfile": null
}
```

**Errors:**

- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Keycloak integration failure

---

### Register Doctor
**Gateway Path:** `POST /api/auth/register/medecin`
**Service Path:** `POST /auth/register/medecin`

**Access:** Public (no authentication required)

**Description:** Allows doctors to self-register in the system.

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "SecurePassword123!",
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "phoneNumber": "+1234567892",
  "addressLine": "456 Medical Plaza",
  "city": "Boston",
  "country": "USA",
  "specialization": "Cardiology",
  "licenseNumber": "MED-12345",
  "yearsOfExperience": 10,
  "consultationFee": 150.00
}
```

**Response:** `201 Created`

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "keycloakId": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
  "email": "doctor@example.com",
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "phoneNumber": "+1234567892",
  "addressLine": "456 Medical Plaza",
  "city": "Boston",
  "country": "USA",
  "enabled": true,
  "createdAt": "2026-01-09T00:00:00",
  "updatedAt": "2026-01-09T00:00:00",
  "patientProfile": null,
  "medecinProfile": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "specialization": "Cardiology",
    "licenseNumber": "MED-12345",
    "yearsOfExperience": 10,
    "consultationFee": 150.00,
    "available": true
  }
}
```

**Errors:**

- `400 Bad Request` - Validation errors
- `409 Conflict` - Email or license number already exists
- `500 Internal Server Error` - Keycloak integration failure

---

## Admin Endpoints

### Create Admin User
**Gateway Path:** `POST /api/admin/users`
**Service Path:** `POST /admin/users`

**Access:** Requires `ROLE_ADMIN`

**Description:** Create users with GESTIONNAIRE or RESPONSABLE_SECURITE roles.

**Request Body:**

```json
{
  "email": "manager@medinsight.com",
  "password": "SecurePassword123!",
  "firstName": "Alice",
  "lastName": "Manager",
  "phoneNumber": "+1234567893",
  "addressLine": "789 Admin Building",
  "city": "Washington",
  "country": "USA",
  "role": "GESTIONNAIRE"
}
```

**Response:** `201 Created`

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "keycloakId": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
  "email": "manager@medinsight.com",
  "firstName": "Alice",
  "lastName": "Manager",
  "phoneNumber": "+1234567893",
  "addressLine": "789 Admin Building",
  "city": "Washington",
  "country": "USA",
  "enabled": true,
  "createdAt": "2026-01-09T00:00:00",
  "updatedAt": "2026-01-09T00:00:00",
  "patientProfile": null,
  "medecinProfile": null
}
```

**Errors:**

- `400 Bad Request` - Invalid role (only GESTIONNAIRE and RESPONSABLE_SECURITE allowed)
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User does not have ADMIN role
- `409 Conflict` - Email already exists

---

### Assign Role to User

**Endpoint:** `PUT /api/admin/users/{keycloakId}/roles`

**Access:** Requires `ROLE_ADMIN`

**Description:** Assign additional roles to an existing user.

**Path Parameters:**
- `keycloakId` - The Keycloak user ID

**Request Body:**

```json
{
  "role": "GESTIONNAIRE"
}
```

**Response:** `200 OK`

```json
{
  "message": "Role assigned successfully"
}
```

**Errors:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User does not have ADMIN role
- `404 Not Found` - User not found

---

### List All Users
**Gateway Path:** `GET /api/admin/users`
**Service Path:** `GET /admin/users`

**Access:** Requires `ROLE_ADMIN`

**Description:** Retrieve a paginated list of all users.

**Query Parameters:**
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 20) - Page size
- `sort` (optional) - Sort field and direction (e.g., `email,asc`)

**Example Request:**

```
GET /api/admin/users?page=0&size=10&sort=createdAt,desc
```

**Response:** `200 OK`

```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "keycloakId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "patient@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "enabled": true,
      "createdAt": "2026-01-09T00:00:00",
      "patientProfile": { /* ... */ }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 50,
  "totalPages": 5,
  "last": false
}
```

**Errors:**

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User does not have ADMIN role

---

## Internal Endpoints

These endpoints are for service-to-service communication and should be protected at the API Gateway level.

### Get User by ID

**Endpoint:** `GET /api/internal/users/{id}`

**Description:** Retrieve user details by UUID.

**Response:** `200 OK` (same structure as registration response)

---

### Get User by Keycloak ID

**Endpoint:** `GET /api/internal/users/keycloak/{keycloakId}`

**Description:** Retrieve user details by Keycloak ID.

**Response:** `200 OK` (same structure as registration response)

---

### Get User by Email

**Endpoint:** `GET /api/internal/users/email/{email}`

**Description:** Retrieve user details by email address.

**Response:** `200 OK` (same structure as registration response)

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/register/patient",
  "timestamp": "2026-01-09T00:00:00"
}
```

For validation errors:

```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid request parameters",
  "errors": {
    "email": "Email must be valid",
    "password": "Password must be at least 8 characters"
  },
  "path": "/api/auth/register/patient",
  "timestamp": "2026-01-09T00:00:00"
}
```

---

## Swagger/OpenAPI

Interactive API documentation is available at:

```
http://localhost:8081/swagger-ui.html
```

OpenAPI JSON specification:

```
http://localhost:8081/v3/api-docs
```
