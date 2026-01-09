# MedInsight API Gateway

The MedInsight API Gateway routes external traffic to internal microservices, enforces authentication and authorization using Keycloak-issued JWT tokens, exposes OpenAPI documentation, and integrates with Eureka for service discovery.

## Key Features
- Spring Cloud Gateway on Spring Boot 3 (Java 17)
- Eureka client for service discovery (`lb://` URIs)
- OAuth2 Resource Server (JWT) with Keycloak
- Role-based access control (RBAC) mapping Keycloak realm roles to Spring Security roles
- CORS support for frontend apps (e.g., React)
- OpenAPI/Swagger UI at `/swagger-ui.html`
# Gateway Service

API Gateway for the MedInsight E-Health Platform using Spring Cloud Gateway.

## Features

- Centralized API routing to all microservices
- OAuth2 Resource Server with JWT validation
- CORS configuration for frontend integration
- Service discovery integration with Eureka
- Rate limiting and circuit breaker support
- OpenAPI/Swagger aggregation
- Actuator endpoints for monitoring

## Tech Stack

- Java 17
- Spring Boot 3.x
- Spring Cloud Gateway
- Spring Security OAuth2 Resource Server
- Spring Cloud Netflix Eureka Client
- Springdoc OpenAPI

## Routes

The gateway routes requests to backend microservices:

| Path | Target Service | Description |
|------|---------------|-------------|
| `/api/auth/**` | auth-service | Authentication and user management |
| `/api/admin/**` | auth-service | Admin operations |
| `/api/patients/**` | patient-service | Patient operations |
| `/api/doctors/**` | doctor-service | Doctor operations |
| `/api/appointments/**` | appointment-service | Appointment management |

## Security

### JWT Validation

All requests (except public endpoints) require a valid JWT token from Keycloak:

```bash
curl -H "Authorization: Bearer <jwt_token>" http://localhost:8080/api/patients
```

### Public Endpoints

The following endpoints are publicly accessible:
- `POST /api/auth/register/patient`
- `POST /api/auth/register/medecin`
- `/swagger-ui.html`
- `/v3/api-docs/**`
- `/actuator/health`

### Role-Based Access

The gateway validates JWT tokens and extracts roles from Keycloak:
- Admin endpoints require `ROLE_ADMIN`
- Other endpoints require valid authentication

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (React frontend)
- `http://localhost:8080` (Gateway itself)

Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

## Running Locally

```bash
# Build
mvn clean package

# Run
java -jar target/gateway-service-1.0.0.jar
```

The gateway will start on port **8080**.

## Docker

```bash
# Build image
docker build -t medinsight/gateway-service:latest .

# Run container
docker run -p 8080:8080 \
  -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://discovery-service:8761/eureka/ \
  -e SECURITY_OAUTH2_ISSUER_URI=http://keycloak:8080/realms/medinsight \
  medinsight/gateway-service:latest
```

## Configuration

Key environment variables:

- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` - Eureka server URL
- `SECURITY_OAUTH2_ISSUER_URI` - Keycloak issuer URI
- `SECURITY_OAUTH2_JWK_SET_URI` - Keycloak JWK set URI

## API Documentation

### Swagger UI

Access aggregated API documentation:
- **URL**: http://localhost:8080/swagger-ui.html

### OpenAPI Spec

- **URL**: http://localhost:8080/v3/api-docs

## Monitoring

### Health Check

```bash
curl http://localhost:8080/actuator/health
```

### Actuator Endpoints

Available at `/actuator/*`:
- `/actuator/health` - Health status
- `/actuator/info` - Application info
- `/actuator/gateway/routes` - Configured routes

## Testing Routes

### Test Patient Registration (Public)

```bash
curl -X POST http://localhost:8080/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Test Authenticated Endpoint

```bash
# First, get a token from Keycloak
TOKEN=$(curl -X POST http://localhost:8180/realms/medinsight/protocol/openid-connect/token \
  -d "client_id=medinsight-gateway" \
  -d "client_secret=gateway-secret" \
  -d "grant_type=password" \
  -d "username=user@example.com" \
  -d "password=password" \
  | jq -r '.access_token')

# Use the token to access protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/patients
```

## Docker Compose

The service is included in the main `docker-compose.yml`:

```yaml
gateway-service:
  build: ./Backend/gateway-service
  ports:
    - "8080:8080"
  depends_on:
    - discovery-service
    - keycloak
  environment:
    EUREKA_CLIENT_SERVICEURL_DEFAULTZONE: http://discovery-service:8761/eureka/
    SECURITY_OAUTH2_ISSUER_URI: http://keycloak:8080/realms/medinsight
```

## Load Balancing

The gateway uses Eureka for service discovery and automatically load balances requests across multiple instances of the same service using the `lb://` URI scheme.

## Circuit Breaker

Circuit breaker patterns can be configured for resilience:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: patient-service
          uri: lb://patient-service
          predicates:
            - Path=/api/patients/**
          filters:
            - name: CircuitBreaker
              args:
                name: patientServiceCircuitBreaker
```

Swagger UI: http://localhost:8080/swagger-ui.html

## Testing

Run tests for the gateway from the project root or this module:

```bash
# From project root (recommended)
mvn -pl gateway-service -am test

# Or from the module directory
cd gateway-service
mvn test
```

Coverage:
- GatewayServiceApplicationTests: boots the Spring context to ensure the gateway starts.
- SecurityConfigTest: verifies RBAC using mocked JWTs (Keycloak roles in `realm_access.roles`) and checks public endpoints.
- GatewayRoutesTest: ensures that route definitions from `application.yml` are loaded (patients, doctors, appointments, auth).

## Docker
Build the image (after packaging):
```bash
cd gateway-service
docker build -t medinsight/gateway-service:1.0.0 .
```

Run the container:
```bash
docker run --rm -p 8080:8080 \
  -e SECURITY_OAUTH2_ISSUER_URI="http://localhost:8080/realms/medinsight" \
  -e SECURITY_OAUTH2_JWK_SET_URI="http://localhost:8080/realms/medinsight/protocol/openid-connect/certs" \
  -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE="http://host.docker.internal:8761/eureka/" \
  --name gateway medinsight/gateway-service:1.0.0
```

## Notes
- No controllers or business logic are included; this service strictly authenticates, authorizes, and routes requests.
- For production, configure TLS, stricter CORS, proper timeouts/limits, and observability.
