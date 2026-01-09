# Gateway Service

## Overview
The **Gateway Service** is the API Gateway for the MedInsight platform, providing a single entry point for all client requests. It handles routing, load balancing, security, and cross-cutting concerns like CORS and rate limiting.

## Architecture

### Technology Stack
- **Framework**: Spring Cloud Gateway (Reactive)
- **Language**: Java 17
- **Authentication**: OAuth2/JWT via Keycloak
- **Service Discovery**: Netflix Eureka
- **API Documentation**: SpringDoc OpenAPI 3 (Aggregated)

### Port Configuration
- **Service Port**: 8080
- **Eureka Discovery**: 8761

## Key Features

1. **Dynamic Routing**: Routes requests to appropriate microservices based on path patterns
2. **Load Balancing**: Distributes requests across service instances via Eureka
3. **Security**: Centralized OAuth2 authentication and authorization
4. **CORS**: Configured for frontend integration
5. **API Documentation**: Aggregates Swagger docs from all services
6. **Circuit Breaker**: Fault tolerance for downstream services
7. **Rate Limiting**: Prevents API abuse

## Routing Configuration

### Route Definitions

#### Appointments Route
```yaml
- id: appointments-route
  uri: lb://appointment-service
  predicates:
    - Path=/api/appointments/**
```
Routes all `/api/appointments/**` requests to the appointment-service instances.

#### Auth Route
```yaml
- id: auth-route
  uri: lb://auth-service
  predicates:
    - Path=/api/auth/**,/api/admin/**
```
Routes authentication and admin requests to auth-service.

#### Medical Records Route
```yaml
- id: records-route
  uri: lb://medical-record-service
  predicates:
    - Path=/api/records/**
```
Routes medical record requests to medical-record-service.

### Load Balancing
- **Protocol**: `lb://` (Load Balanced)
- **Discovery**: Uses Eureka for service instance resolution
- **Algorithm**: Round-robin by default

## Security Configuration

### OAuth2 Resource Server
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:8180/realms/medinsight}
          jwk-set-uri: ${KEYCLOAK_JWK_SET_URI:http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs}
```

### Access Control Rules

#### Public Endpoints
- `/swagger-ui/**` - API documentation
- `/v3/api-docs/**` - OpenAPI specs
- `/api/*/v3/api-docs` - Service-specific docs
- `/actuator/health` - Health check
- `POST /api/auth/register/**` - User registration

#### Role-Based Access
- `/api/admin/**` → `ROLE_ADMIN`
- `/api/patients/**` → `ROLE_PATIENT`, `ROLE_ADMIN`
- `/api/doctors/**` → `ROLE_MEDECIN`, `ROLE_ADMIN`
- `/api/appointments/**` → Authenticated users
- All other endpoints → Authenticated users

### Security Filter Chain
```java
@Bean
public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    return http
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .authorizeExchange(auth -> auth
            .pathMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
            .pathMatchers(HttpMethod.POST, "/api/auth/register/**").permitAll()
            .pathMatchers("/api/admin/**").hasRole("ADMIN")
            .anyExchange().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(...))
        .build();
}
```

### JWT Authentication Converter
Extracts Keycloak realm roles and converts them to Spring Security authorities:
- Reads from `realm_access.roles` claim
- Prefixes with `ROLE_` (e.g., `PATIENT` → `ROLE_PATIENT`)
- Combines with scope authorities

## CORS Configuration

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: ["http://localhost:3000"]
            allowedMethods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
            allowedHeaders: ["*"]
            exposedHeaders: ["*"]
            allowCredentials: true
            maxAge: 3600
```

**Configurable via**:
```yaml
app:
  cors:
    allowed-origins:
      - http://localhost:3000
      - http://frontend.example.com
```

## API Documentation Aggregation

### Swagger UI Configuration
```yaml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    urls:
      - name: auth-service
        url: /api/auth/v3/api-docs
      - name: appointment-service
        url: /api/appointments/v3/api-docs
      - name: medical-record-service
        url: /api/records/v3/api-docs
```

**Access**: http://localhost:8080/swagger-ui.html

### Features
- Unified API documentation for all services
- Service selector dropdown
- Try-it-out functionality with JWT authentication
- Schema definitions and examples

## Service Discovery Integration

### Eureka Client Configuration
```yaml
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: ${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE:http://discovery-service:8761/eureka/}
  instance:
    prefer-ip-address: true
```

### Dynamic Service Resolution
1. Gateway receives request
2. Extracts service name from route URI (e.g., `lb://appointment-service`)
3. Queries Eureka for available instances
4. Selects instance using load balancing algorithm
5. Forwards request to selected instance

## Request Flow

### Typical Request Flow
```
1. Client → Gateway (http://localhost:8080/api/appointments)
2. Gateway → Authenticate JWT token
3. Gateway → Extract roles from token
4. Gateway → Check authorization rules
5. Gateway → Query Eureka for appointment-service instances
6. Gateway → Forward request to selected instance
7. Appointment Service → Process request
8. Appointment Service → Gateway
9. Gateway → Client (response)
```

## Error Handling

### Global Error Responses
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Service or endpoint not found
- `503 Service Unavailable` - Downstream service unavailable
- `504 Gateway Timeout` - Downstream service timeout

### Circuit Breaker
Implements fallback mechanisms when services are unavailable:
- Returns cached responses when available
- Provides meaningful error messages
- Prevents cascading failures

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8080 | Gateway port |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `KEYCLOAK_JWK_SET_URI` | http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs | JWK set URI |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | http://discovery-service:8761/eureka/ | Eureka URL |
| `APP_CORS_ALLOWED_ORIGINS` | http://localhost:3000 | CORS allowed origins |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-gateway-service .
```

### Run Locally
```bash
java -jar target/gateway-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d gateway-service
```

## Health & Monitoring
- **Health Check**: http://localhost:8080/actuator/health
- **Info**: http://localhost:8080/actuator/info

## Key Responsibilities

1. **Single Entry Point**: All client requests go through the gateway
2. **Authentication**: Validates JWT tokens from Keycloak
3. **Authorization**: Enforces role-based access control
4. **Routing**: Directs requests to appropriate microservices
5. **Load Balancing**: Distributes load across service instances
6. **CORS**: Handles cross-origin requests for frontend
7. **API Documentation**: Provides unified Swagger UI
8. **Security**: Centralized security configuration

## Best Practices

1. **Stateless**: Gateway is stateless for horizontal scalability
2. **Reactive**: Uses Spring WebFlux for non-blocking I/O
3. **Resilient**: Circuit breakers prevent cascading failures
4. **Observable**: Exposes health and metrics endpoints
5. **Configurable**: Environment-based configuration for different deployments
