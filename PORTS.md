### MedInsight Backend - Ports Reference

This document lists the TCP ports used across the MedInsight microservices stack to help with local and containerized deployments.

- Discovery Service (Eureka Server): 8761
  - Dashboard: http://localhost:8761
  - Eureka endpoint: http://localhost:8761/eureka/
  - Health: http://localhost:8761/actuator/health
  - API Documentation: See docs/discovery-service-api.md
- API Gateway: 8080
  - Swagger UI: http://localhost:8080/swagger-ui.html
  - Health: http://localhost:8080/actuator/health
  - Gateway Routes: http://localhost:8080/actuator/gateway/routes
  - API Documentation: See docs/gateway-service-api.md
  - Routes:
    - /api/auth/** → auth-service
    - /api/admin/** → auth-service
    - /api/patients/** → patient-service
    - /api/doctors/** → doctor-service
    - /api/appointments/** → appointment-service
- Auth Service: 8081
  - Swagger UI: http://localhost:8081/swagger-ui.html
  - Health: http://localhost:8081/actuator/health
  - API Documentation: See docs/auth-service-api.md
  - Endpoints:
    - POST /api/auth/register/patient
    - POST /api/auth/register/medecin
    - POST /api/admin/users (ADMIN only)
    - PUT /api/admin/users/{id}/roles (ADMIN only)
    - GET /api/admin/users (ADMIN only)
    - GET /api/internal/users/{id}
- Keycloak (example, configurable): 8180
  - Admin Console: http://localhost:8180
  - Realm issuer (example): http://keycloak:8080/realms/medinsight
  - JWK set (example): http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs
- Patient Service: dynamic (discovered via Eureka)
- Doctor Service: dynamic (discovered via Eureka)
- Appointment Service: dynamic (discovered via Eureka)

Notes
- Backend services register themselves with Eureka and are reached by the gateway via `lb://SERVICE-NAME`, so their container ports are not hardcoded here.
- In Docker Compose or Kubernetes, map the container ports as needed for external access; the gateway typically exposes port 8080 to clients.
- All client requests should go through the API Gateway (port 8080) for proper authentication and routing.
