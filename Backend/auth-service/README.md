# Auth Service

Authentication and User Management Service for MedInsight E-Health Platform.

## Features

- User registration for PATIENT and MEDECIN roles
- Admin-only creation of GESTIONNAIRE and RESPONSABLE_SECURITE users
- Integration with Keycloak for authentication
- PostgreSQL persistence for user profiles
- Role-based security with OAuth2 JWT validation
- Service discovery with Eureka
- OpenAPI/Swagger documentation

## Tech Stack

- Java 17
- Spring Boot 3.x
- Spring Security with OAuth2 Resource Server
- Spring Data JPA
- PostgreSQL
- Keycloak
- Eureka Client
- Flyway
- Lombok
- OpenAPI 3.0

## API Endpoints

### Public Endpoints

- `POST /api/auth/register/patient` - Patient self-registration
- `POST /api/auth/register/medecin` - Doctor self-registration

### Admin Endpoints (Requires ROLE_ADMIN)

- `POST /api/admin/users` - Create GESTIONNAIRE or RESPONSABLE_SECURITE
- `PUT /api/admin/users/{keycloakId}/roles` - Assign roles to users
- `GET /api/admin/users` - List all users (paginated)

### Internal Endpoints

- `GET /api/internal/users/{id}` - Get user by ID
- `GET /api/internal/users/keycloak/{keycloakId}` - Get user by Keycloak ID
- `GET /api/internal/users/email/{email}` - Get user by email

## Running Locally

```bash
# Build
mvn clean package

# Run
java -jar target/auth-service-1.0.0.jar
```

## Docker

```bash
# Build image
docker build -t medinsight/auth-service:latest .

# Run container
docker run -p 8081:8081 \
  -e POSTGRES_USER=meduser \
  -e POSTGRES_PASSWORD=MedSecurePass2024! \
  -e POSTGRES_DB=medinsight \
  -e DB_HOST=postgres \
  -e KEYCLOAK_URL=http://keycloak:8080 \
  medinsight/auth-service:latest
```

## Configuration

Key environment variables:

- `DB_HOST` - PostgreSQL host
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_ADMIN` - Keycloak admin username
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password
- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` - Eureka server URL

## Documentation

- Swagger UI: http://localhost:8081/swagger-ui.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs
