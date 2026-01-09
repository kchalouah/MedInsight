# Appointment Service

## Overview
The **Appointment Service** manages medical appointments and prescriptions in the MedInsight platform. It handles appointment scheduling, status management, and prescription issuance with role-based access control.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Database**: PostgreSQL
- **Authentication**: OAuth2/JWT via Keycloak
- **Service Discovery**: Netflix Eureka
- **API Documentation**: SpringDoc OpenAPI 3

### Port Configuration
- **Service Port**: 8082
- **Eureka Discovery**: 8761
- **Gateway Access**: http://localhost:8080/api/appointments

## Domain Model

### Entities

#### 1. Appointment Entity
**Table**: `appointments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Appointment ID |
| `patientId` | UUID | Not Null, Indexed | Patient's Keycloak ID |
| `doctorId` | UUID | Not Null, Indexed | Doctor's Keycloak ID |
| `appointmentDateTime` | LocalDateTime | Not Null, Indexed | Scheduled date and time |
| `status` | AppointmentStatus | Not Null, Indexed, Default: SCHEDULED | Current status |
| `notes` | String(500) | - | Doctor's notes |
| `reason` | String(500) | - | Appointment reason |
| `createdAt` | LocalDateTime | Not Null, Auto-generated | Creation timestamp |
| `updatedAt` | LocalDateTime | Auto-updated | Last update timestamp |

**AppointmentStatus Enum**:
- `SCHEDULED` - Appointment confirmed
- `COMPLETED` - Appointment finished
- `CANCELLED` - Appointment cancelled
- `NO_SHOW` - Patient did not attend

**Indexes**:
- `idx_appointment_patient` on `patient_id`
- `idx_appointment_doctor` on `doctor_id`
- `idx_appointment_datetime` on `appointment_date_time`
- `idx_appointment_status` on `status`

#### 2. Prescription Entity
**Table**: `prescriptions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Prescription ID |
| `appointmentId` | UUID | Not Null, Indexed | Associated appointment |
| `patientId` | UUID | Not Null, Indexed | Patient's Keycloak ID |
| `doctorId` | UUID | Not Null, Indexed | Prescribing doctor's ID |
| `medicationName` | String | Not Null | Medication name |
| `dosage` | String | Not Null | Dosage instructions (e.g., "500mg") |
| `duration` | String | Not Null | Treatment duration (e.g., "7 days") |
| `instructions` | Text | - | Additional instructions |
| `issuedAt` | LocalDateTime | Auto-generated, Immutable | Issue timestamp |
| `updatedAt` | LocalDateTime | Auto-updated | Last update timestamp |

**Indexes**:
- `idx_prescription_appointment` on `appointment_id`
- `idx_prescription_patient` on `patient_id`
- `idx_prescription_doctor` on `doctor_id`

## Service Layer

### Key Services

#### AppointmentService
**Methods**:
- `createAppointment(AppointmentRequest, Authentication)` - Create new appointment
  - Validates patient/doctor IDs
  - Checks for scheduling conflicts
  - Enforces role-based access (patients can only book for themselves)
  
- `getAppointmentById(UUID, Authentication)` - Retrieve appointment by ID
  - Access control: patients see only their own, doctors see their assigned
  
- `updateAppointment(UUID, AppointmentRequest, Authentication)` - Update appointment
  - Patients can cancel their own appointments
  - Doctors can update status and notes
  
- `getAppointmentsByPatient(UUID, Pageable)` - List patient's appointments
  
- `getAppointmentsByDoctor(UUID, Pageable)` - List doctor's appointments
  
- `getAppointmentsWithFilters(...)` - Advanced filtering
  - Filter by patient, doctor, status, date range
  
- `deleteAppointment(UUID, Authentication)` - Delete appointment (admin only)

#### PrescriptionService
**Methods**:
- `createPrescription(UUID appointmentId, PrescriptionRequest, Authentication)` - Issue prescription
  - Only doctors can issue prescriptions
  - Must be for their own appointments
  
- `getPrescriptionsByAppointment(UUID, Authentication)` - Get appointment prescriptions
  - Access control enforced
  
- `getPatientPrescriptions(UUID patientId, Pageable, Authentication)` - Get patient's prescription history
  - Patients can view their own
  - Doctors and admins can view any

## REST API Endpoints

### Appointment Endpoints

#### Create Appointment
```http
POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "uuid",
  "doctorId": "uuid",
  "appointmentDateTime": "2024-12-25T10:00:00",
  "reason": "General checkup",
  "notes": "Patient reports minor headache"
}
```
**Access**: `ROLE_PATIENT`, `ROLE_ADMIN`
**Response**: `201 Created`

#### Get Appointment by ID
```http
GET /api/appointments/{id}
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

#### Update Appointment
```http
PUT /api/appointments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointmentDateTime": "2024-12-25T11:00:00",
  "status": "COMPLETED",
  "notes": "Post-consultation notes"
}
```
**Access**: `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

#### List Appointments (with Filters)
```http
GET /api/appointments?patientId={uuid}&status=SCHEDULED&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```
**Query Parameters**:
- `patientId` - Filter by patient UUID
- `doctorId` - Filter by doctor UUID
- `status` - Filter by status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- `startDate` - Start of date range (ISO-8601)
- `endDate` - End of date range (ISO-8601)
- `page` - Page number (default: 0)
- `size` - Page size (default: 20)

**Access**: `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK` (Paginated)

#### List Patient Appointments
```http
GET /api/appointments/patient/{patientId}
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT` (self), `ROLE_ADMIN`
**Response**: `200 OK`

#### List Doctor Appointments
```http
GET /api/appointments/doctor/{doctorId}
Authorization: Bearer {token}
```
**Access**: `ROLE_MEDECIN` (self), `ROLE_ADMIN`
**Response**: `200 OK`

### Prescription Endpoints

#### Issue Prescription
```http
POST /api/appointments/{appointmentId}/prescriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "uuid",
  "medicationName": "Amoxicillin",
  "dosage": "500mg, 3 times daily",
  "duration": "7 days",
  "instructions": "Take after meals"
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `201 Created`

#### Get Appointment Prescriptions
```http
GET /api/appointments/{appointmentId}/prescriptions
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

#### Get Patient Prescription History
```http
GET /api/prescriptions/patient/{patientId}?page=0&size=20
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK` (Paginated)

## Security Configuration

### OAuth2 Resource Server
- **Issuer URI**: Configurable via `KEYCLOAK_ISSUER_URI`
- **JWK Set URI**: Configurable via `KEYCLOAK_JWK_SET_URI`
- **Role Extraction**: From `realm_access.roles` claim
- **Role Prefix**: `ROLE_`

### Access Control Rules
1. **Appointments**:
   - Create: Patients (self only), Admins
   - Read: Owner (patient/doctor), Admins
   - Update: Owner, Admins
   - Delete: Admins only

2. **Prescriptions**:
   - Create: Doctors (own appointments), Admins
   - Read: Patient (self), Doctor, Admins
   - Update: Not allowed
   - Delete: Admins only

### Method-Level Security
```java
@PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
public AppointmentResponse createAppointment(...)

@PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
public PrescriptionResponse createPrescription(...)
```

## Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/${POSTGRES_DB:medinsight}
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
```

## Business Logic

### Appointment Creation Validation
1. Verify patient and doctor exist (via auth-service)
2. Check for scheduling conflicts
3. Validate appointment is in the future
4. Enforce role-based restrictions

### Prescription Issuance Validation
1. Verify appointment exists
2. Verify doctor is assigned to the appointment
3. Validate patient ID matches appointment
4. Ensure all required fields are provided

## Error Handling

### Custom Exceptions
- `AppointmentNotFoundException` → 404
- `PrescriptionNotFoundException` → 404
- `UnauthorizedAccessException` → 403
- `AppointmentConflictException` → 409
- `ValidationException` → 400

### Global Exception Handler
Provides consistent error responses across all endpoints.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8082 | Service port |
| `DB_HOST` | localhost | PostgreSQL host |
| `POSTGRES_DB` | medinsight | Database name |
| `POSTGRES_USER` | - | Database username |
| `POSTGRES_PASSWORD` | - | Database password |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `KEYCLOAK_JWK_SET_URI` | http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs | JWK set URI |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | http://discovery-service:8761/eureka/ | Eureka URL |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-appointment-service .
```

### Run Locally
```bash
java -jar target/appointment-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d appointment-service
```

## API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Service-specific docs**: http://localhost:8080/api/appointments/v3/api-docs

## Health & Monitoring
- **Health Check**: http://localhost:8082/actuator/health
- **Metrics**: http://localhost:8082/actuator/metrics
- **Prometheus**: http://localhost:8082/actuator/prometheus

## Integration Points

### Auth Service
- Validates user existence
- Retrieves user roles
- Communication via internal endpoints

### Medical Record Service
- Appointments are referenced in patient dossiers
- Prescriptions are aggregated in medical records

### Audit Service
- All appointment operations are logged
- Prescription issuance is audited
