# Auth Service

## Overview
The **Auth Service** is the central authentication and user management microservice for the MedInsight platform. It handles user registration, profile management, and integrates with Keycloak for OAuth2/OIDC authentication.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Database**: PostgreSQL
- **Authentication**: Keycloak (OAuth2/OIDC)
- **Service Discovery**: Netflix Eureka
- **API Documentation**: SpringDoc OpenAPI 3

### Port Configuration
- **Service Port**: 8081
- **Eureka Discovery**: 8761
- **Gateway Access**: http://localhost:8080/api/auth

## Domain Model

### Entities

#### 1. User Entity
**Table**: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Internal database ID |
| `keycloakId` | String | Unique, Not Null, Indexed | Keycloak user ID (primary identifier) |
| `email` | String(255) | Unique, Not Null, Indexed | User email address |
| `firstName` | String(100) | - | User's first name |
| `lastName` | String(100) | - | User's last name |
| `phoneNumber` | String(20) | - | Contact phone number |
| `addressLine` | String(255) | - | Street address |
| `city` | String(100) | - | City |
| `country` | String(100) | - | Country |
| `enabled` | Boolean | Not Null, Default: true | Account status |
| `createdAt` | LocalDateTime | Not Null, Auto-generated | Creation timestamp |
| `updatedAt` | LocalDateTime | Auto-updated | Last update timestamp |

**Relationships**:
- `OneToOne` with `PatientProfile` (cascade all, orphan removal)
- `OneToOne` with `MedecinProfile` (cascade all, orphan removal)

#### 2. Role Entity
**Table**: `roles`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Role ID |
| `name` | RoleEnum | Unique, Not Null | Role name (PATIENT, MEDECIN, ADMIN, etc.) |
| `description` | String(255) | - | Role description |

**RoleEnum Values**:
- `PATIENT` - Patient user
- `MEDECIN` - Doctor/Physician
- `ADMIN` - System administrator
- `GESTIONNAIRE` - Manager
- `RESPONSABLE_SECURITE` - Security officer

#### 3. PatientProfile Entity
**Table**: `patient_profiles`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Profile ID |
| `user` | User | OneToOne, Not Null, Unique | Associated user |
| `dateOfBirth` | LocalDate | - | Patient's birth date |
| `gender` | Gender (Enum) | - | Patient's gender (MALE, FEMALE, OTHER) |
| `bloodType` | String(5) | - | Blood type (A+, B-, etc.) |
| `emergencyContactName` | String(100) | - | Emergency contact name |
| `emergencyContactPhone` | String(20) | - | Emergency contact phone |
| `insuranceProvider` | String(100) | - | Insurance company name |
| `insuranceNumber` | String(50) | - | Insurance policy number |

#### 4. MedecinProfile Entity
**Table**: `medecin_profiles`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Profile ID |
| `user` | User | OneToOne, Not Null, Unique | Associated user |
| `specialization` | String(100) | - | Medical specialization |
| `licenseNumber` | String(50) | Unique | Medical license number |
| `yearsOfExperience` | Integer | - | Years of practice |
| `consultationFee` | BigDecimal(10,2) | - | Consultation fee amount |
| `available` | Boolean | Not Null, Default: true | Availability status |

## Service Layer

### Key Services

#### UserService
**Methods**:
- `createUser(UserRequest)` - Create new user
- `getUserById(UUID)` - Retrieve user by ID
- `getUserByKeycloakId(String)` - Retrieve user by Keycloak ID
- `getUserByEmail(String)` - Retrieve user by email
- `updateUser(UUID, UserRequest)` - Update user information
- `deleteUser(UUID)` - Soft delete user
- `toUserResponse(User)` - Convert entity to DTO

#### KeycloakService
**Methods**:
- `createKeycloakUser(String email, String password, List<String> roles)` - Create user in Keycloak
- `assignRolesToUser(String userId, List<String> roles)` - Assign roles
- `deleteKeycloakUser(String userId)` - Delete user from Keycloak
- `updateKeycloakUser(String userId, UserUpdateRequest)` - Update Keycloak user

#### PatientRegistrationService
**Methods**:
- `registerPatient(PatientRegistrationRequest)` - Register new patient
- Handles both database and Keycloak user creation
- Assigns PATIENT role automatically

#### MedecinRegistrationService
**Methods**:
- `registerMedecin(MedecinRegistrationRequest)` - Register new doctor
- Handles both database and Keycloak user creation
- Assigns MEDECIN role automatically

#### RoleService
**Methods**:
- `getAllRoles()` - List all available roles
- `getRoleByName(RoleEnum)` - Get specific role
- `initializeDefaultRoles()` - Bootstrap default roles

## REST API Endpoints

### Public Endpoints

#### Register Patient
```http
POST /api/auth/register/patient
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "phoneNumber": "+1234567890"
}
```

#### Register Doctor
```http
POST /api/auth/register/medecin
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "SecurePass123!",
  "firstName": "Dr. Jane",
  "lastName": "Smith",
  "specialization": "Cardiology",
  "licenseNumber": "MED-12345",
  "yearsOfExperience": 10,
  "consultationFee": 150.00
}
```

### Protected Endpoints (Require Authentication)

#### Get User Profile
```http
GET /api/auth/users/{id}
Authorization: Bearer {token}
```

#### Update User
```http
PUT /api/auth/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Updated Name",
  "phoneNumber": "+9876543210"
}
```

### Admin Endpoints (ADMIN Role Required)

#### List All Users
```http
GET /api/admin/users
Authorization: Bearer {admin_token}
```

#### Create Admin User
```http
POST /api/admin/users/create
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "admin@medinsight.com",
  "password": "AdminPass123!",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN"
}
```

### Internal Endpoints (Service-to-Service)

#### Verify User Exists
```http
GET /api/internal/users/exists/{keycloakId}
```

#### Get User by Keycloak ID
```http
GET /api/internal/users/keycloak/{keycloakId}
```

## Security Configuration

### OAuth2 Resource Server
- **Issuer URI**: Configurable via `KEYCLOAK_ISSUER_URI`
- **JWK Set URI**: Configurable via `KEYCLOAK_JWK_SET_URI`
- **Role Extraction**: From `realm_access.roles` claim
- **Role Prefix**: `ROLE_` (e.g., `ROLE_PATIENT`)

### Access Control
- Public: Registration endpoints
- Authenticated: User profile management
- Admin: User administration, role management
- Internal: Service-to-service communication

## Database Configuration

### Connection
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

### Data Initialization
- **DataInitializer.java**: Bootstraps default roles on startup
- Roles: PATIENT, MEDECIN, ADMIN, GESTIONNAIRE, RESPONSABLE_SECURITE

## Integration Points

### Keycloak Integration
- **Admin Client**: Manages users and roles
- **Client ID**: `auth-service`
- **Client Secret**: Configured via environment
- **Realm**: `medinsight`

### Service Discovery
- **Eureka Client**: Registers with discovery service
- **Service Name**: `auth-service`
- **Instance ID**: `${spring.application.name}:${random.value}`

## Error Handling

### Global Exception Handler
- `ResourceNotFoundException` → 404
- `DuplicateResourceException` → 409
- `ValidationException` → 400
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- Generic exceptions → 500

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8081 | Service port |
| `DB_HOST` | localhost | PostgreSQL host |
| `POSTGRES_DB` | medinsight | Database name |
| `POSTGRES_USER` | - | Database username |
| `POSTGRES_PASSWORD` | - | Database password |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `KEYCLOAK_JWK_SET_URI` | http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs | JWK set URI |
| `KEYCLOAK_ADMIN` | - | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | - | Keycloak admin password |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | http://discovery-service:8761/eureka/ | Eureka URL |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-auth-service .
```

### Run Locally
```bash
java -jar target/auth-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d auth-service
```

## API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **Service-specific docs**: http://localhost:8080/api/auth/v3/api-docs

## Health & Monitoring
- **Health Check**: http://localhost:8081/actuator/health
- **Metrics**: http://localhost:8081/actuator/metrics
- **Prometheus**: http://localhost:8081/actuator/prometheus
