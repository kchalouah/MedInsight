# Medical Record Service

## Overview
The **Medical Record Service** centralizes patient health records and provides a unified medical dossier by aggregating data from multiple sources. It manages clinical data, consultation notes, and integrates with the appointment service to provide comprehensive patient health information.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Database**: PostgreSQL
- **Authentication**: OAuth2/JWT via Keycloak
- **Service Discovery**: Netflix Eureka
- **Inter-Service Communication**: OpenFeign
- **API Documentation**: SpringDoc OpenAPI 3

### Port Configuration
- **Service Port**: 8084
- **Eureka Discovery**: 8761
- **Gateway Access**: http://localhost:8080/api/records

## Domain Model

### Entities

#### 1. PatientMedicalRecord Entity
**Table**: `medical_records`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Record ID |
| `patientId` | UUID | Not Null, Unique, Indexed | Patient's Keycloak ID |
| `bloodType` | String | - | Blood type (A+, B-, O+, etc.) |
| `allergies` | Text | - | Known allergies (comma-separated) |
| `chronicConditions` | Text | - | Chronic medical conditions |
| `emergencyContactName` | String | - | Emergency contact name |
| `emergencyContactPhone` | String | - | Emergency contact phone |
| `medicalHistory` | Text | - | General medical history |
| `createdAt` | LocalDateTime | Auto-generated, Immutable | Creation timestamp |
| `updatedAt` | LocalDateTime | Auto-updated | Last update timestamp |

**Constraints**:
- One record per patient (unique constraint on `patient_id`)

**Indexes**:
- `idx_record_patient` on `patient_id`

#### 2. ConsultationNote Entity
**Table**: `consultation_notes`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Note ID |
| `appointmentId` | UUID | Not Null, Indexed | Associated appointment |
| `patientId` | UUID | Not Null, Indexed | Patient's Keycloak ID |
| `doctorId` | UUID | Not Null | Doctor's Keycloak ID |
| `noteContent` | Text | Not Null | Clinical note content |
| `createdAt` | LocalDateTime | Auto-generated, Immutable | Creation timestamp |

**Indexes**:
- `idx_note_appointment` on `appointment_id`
- `idx_note_patient` on `patient_id`

## Service Layer

### Key Services

#### RecordService
**Methods**:
- `getMedicalRecordByPatient(UUID patientId)` - Retrieve patient's medical record
  - Returns existing record or creates empty one if not found
  
- `updateMedicalRecord(UUID patientId, MedicalRecordRequest, Authentication)` - Update clinical data
  - Only doctors and admins can update
  - Creates record if doesn't exist
  
- `getFullDossier(UUID patientId, Authentication)` - Get unified patient dossier
  - Aggregates medical record, consultation notes, appointments, and prescriptions
  - Uses Feign clients to fetch data from appointment-service
  - Access control: patient (self), doctors, admins

#### ConsultationNoteService
**Methods**:
- `addConsultationNote(ConsultationNoteRequest, Authentication)` - Add clinical note
  - Only doctors can add notes
  - Must be for their own appointments
  
- `getNotesByPatient(UUID patientId, Authentication)` - Get patient's notes
  - Access control enforced
  
- `getNotesByAppointment(UUID appointmentId, Authentication)` - Get appointment notes

### Feign Clients

#### AppointmentClient
**Interface**: Communicates with appointment-service

**Methods**:
- `getPatientAppointments(UUID patientId, String token)` - Fetch patient's appointments
- `getPatientPrescriptions(UUID patientId, String token)` - Fetch patient's prescriptions

**Configuration**:
- Token relay enabled for authentication propagation
- Circuit breaker for fault tolerance
- Fallback mechanisms for service unavailability

## REST API Endpoints

### Medical Record Endpoints

#### Get Unified Medical Dossier
```http
GET /api/records/patient/{patientId}/dossier
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`

**Response**: `200 OK`
```json
{
  "medicalRecord": {
    "patientId": "uuid",
    "bloodType": "A+",
    "allergies": "Peanuts, Penicillin",
    "chronicConditions": "Hypertension",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+123456789",
    "medicalHistory": "Surgery in 2018"
  },
  "consultationNotes": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "noteContent": "Patient shows improvement...",
      "createdAt": "2024-01-15T10:30:00"
    }
  ],
  "appointments": [...],
  "prescriptions": [...]
}
```

#### Update Patient Clinical Data
```http
PUT /api/records/patient/{patientId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "bloodType": "A+",
  "allergies": "Peanuts, Penicillin",
  "chronicConditions": "Hypertension",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+123456789",
  "medicalHistory": "Surgery in 2018"
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

### Consultation Note Endpoints

#### Add Consultation Note
```http
POST /api/records/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointmentId": "uuid",
  "patientId": "uuid",
  "noteContent": "Patient shows improvement. Continue current medication."
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `201 Created`

#### Get Patient's Consultation Notes
```http
GET /api/records/notes/patient/{patientId}
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

#### Get Appointment's Consultation Notes
```http
GET /api/records/notes/appointment/{appointmentId}
Authorization: Bearer {token}
```
**Access**: `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `200 OK`

## Security Configuration

### OAuth2 Resource Server
- **Issuer URI**: Configurable via `KEYCLOAK_ISSUER_URI`
- **JWK Set URI**: Configurable via `KEYCLOAK_JWK_SET_URI`
- **Role Extraction**: From `realm_access.roles` claim
- **Role Prefix**: `ROLE_`

### Access Control Rules
1. **Medical Records**:
   - Read: Patient (self), Doctors, Admins
   - Update: Doctors, Admins only
   - Delete: Not allowed

2. **Consultation Notes**:
   - Create: Doctors (own appointments), Admins
   - Read: Patient (self), Doctors, Admins
   - Update: Not allowed
   - Delete: Admins only

3. **Unified Dossier**:
   - Read: Patient (self), Doctors, Admins
   - Aggregates data from multiple sources with proper access control

### Method-Level Security
```java
@PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
public MedicalRecordResponse updateMedicalRecord(...)

@PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
public DossierResponse getFullDossier(...)
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

## Inter-Service Communication

### OpenFeign Configuration
```yaml
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
```

### Token Relay
The service automatically propagates JWT tokens when making Feign calls to other services, ensuring proper authentication and authorization across the microservices architecture.

### Circuit Breaker
Implements fallback mechanisms when appointment-service is unavailable:
- Returns partial dossier with available data
- Logs service unavailability
- Prevents cascading failures

## Business Logic

### Dossier Aggregation Flow
1. Fetch patient's medical record from local database
2. Fetch consultation notes from local database
3. Call appointment-service via Feign to get appointments
4. Call appointment-service via Feign to get prescriptions
5. Aggregate all data into unified response
6. Apply access control based on requester's role

### Medical Record Update Validation
1. Verify requester has MEDECIN or ADMIN role
2. Find existing record or create new one
3. Update only provided fields (partial updates supported)
4. Maintain audit trail via timestamps

### Consultation Note Creation Validation
1. Verify appointment exists
2. Verify doctor is assigned to the appointment
3. Validate patient ID matches appointment
4. Ensure note content is not empty

## Error Handling

### Custom Exceptions
- `MedicalRecordNotFoundException` → 404
- `ConsultationNoteNotFoundException` → 404
- `UnauthorizedAccessException` → 403
- `ServiceUnavailableException` → 503
- `ValidationException` → 400

### Global Exception Handler
Provides consistent error responses with detailed messages for debugging.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8084 | Service port |
| `DB_HOST` | localhost | PostgreSQL host |
| `POSTGRES_DB` | medinsight | Database name |
| `POSTGRES_USER` | - | Database username |
| `POSTGRES_PASSWORD` | - | Database password |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `KEYCLOAK_JWK_SET_URI` | http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs | JWK set URI |
| `EUREKA_URL` | http://discovery-service:8761/eureka/ | Eureka URL |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-medical-record-service .
```

### Run Locally
```bash
java -jar target/medical-record-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d medical-record-service
```

## API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Service-specific docs**: http://localhost:8080/api/records/v3/api-docs

## Health & Monitoring
- **Health Check**: http://localhost:8084/actuator/health
- **Metrics**: http://localhost:8084/actuator/metrics
- **Prometheus**: http://localhost:8084/actuator/prometheus

## Integration Points

### Appointment Service (via Feign)
- Fetches patient appointments
- Fetches patient prescriptions
- Token relay for authentication

### Auth Service
- Validates user existence
- Retrieves user roles

### Audit Service
- All record updates are logged
- Consultation note creation is audited

## Data Flow Example

### Getting a Patient Dossier
```
1. Client → Gateway → Medical Record Service
2. Medical Record Service → Local DB (get medical record)
3. Medical Record Service → Local DB (get consultation notes)
4. Medical Record Service → Appointment Service (get appointments)
5. Medical Record Service → Appointment Service (get prescriptions)
6. Medical Record Service → Aggregate all data
7. Medical Record Service → Client (unified dossier)
```

## Key Features

1. **Unified Patient View**: Single endpoint for complete patient health information
2. **Service Aggregation**: Combines data from multiple microservices
3. **Access Control**: Role-based access with patient privacy protection
4. **Fault Tolerance**: Graceful degradation when dependent services are unavailable
5. **Audit Trail**: Automatic timestamping of all changes
6. **Flexible Updates**: Partial updates supported for medical records
