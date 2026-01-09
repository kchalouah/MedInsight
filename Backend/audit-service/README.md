# Audit Service

## Overview
The **Audit Service** provides comprehensive audit logging and compliance tracking for the MedInsight platform. It uses Elasticsearch for high-performance log storage and querying, enabling real-time audit trail analysis and compliance reporting.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Database**: Elasticsearch 8.x
- **Authentication**: OAuth2/JWT via Keycloak
- **Service Discovery**: Netflix Eureka
- **Logging**: Loki integration
- **API Documentation**: SpringDoc OpenAPI 3

### Port Configuration
- **Service Port**: 8085
- **Eureka Discovery**: 8761
- **Elasticsearch**: 9200
- **Gateway Access**: http://localhost:8080/api/audit

## Domain Model

### AuditLog Document
**Elasticsearch Index**: `audit_logs`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique log ID (auto-generated) |
| `timestamp` | Date | When the action occurred |
| `serviceName` | Keyword | Originating service (auth-service, appointment-service, etc.) |
| `userId` | Keyword | User who performed the action (Keycloak ID) |
| `action` | Keyword | Action type (CREATE, UPDATE, DELETE, READ, LOGIN, etc.) |
| `resourceId` | Keyword | ID of affected resource (appointment ID, user ID, etc.) |
| `status` | Keyword | Action result (SUCCESS, FAILURE) |
| `details` | Text | Additional context and details |
| `ipAddress` | Keyword | Client IP address |

### Field Types
- **Keyword**: Exact match, used for filtering and aggregations
- **Text**: Full-text search, analyzed and tokenized
- **Date**: Timestamp with time-zone support

## Service Layer

### Key Services

#### AuditService
**Methods**:
- `logAudit(AuditLogRequest)` - Create new audit log entry
  - Validates required fields
  - Auto-generates timestamp if not provided
  - Stores in Elasticsearch
  
- `searchLogs(AuditSearchRequest, Pageable)` - Search audit logs
  - Supports filtering by service, user, action, status, date range
  - Full-text search on details field
  - Pagination support
  
- `getLogsByUser(String userId, Pageable)` - Get user's audit trail
  
- `getLogsByService(String serviceName, Pageable)` - Get service-specific logs
  
- `getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable)` - Time-based queries
  
- `getFailedActions(Pageable)` - Get all failed operations

## REST API Endpoints

### Audit Log Endpoints

#### Create Audit Log
```http
POST /api/audit/logs
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceName": "appointment-service",
  "userId": "uuid",
  "action": "CREATE_APPOINTMENT",
  "resourceId": "appointment-uuid",
  "status": "SUCCESS",
  "details": "Patient scheduled appointment with Dr. Smith",
  "ipAddress": "192.168.1.100"
}
```
**Access**: All authenticated services (internal use)
**Response**: `201 Created`

#### Search Audit Logs
```http
GET /api/audit/logs?serviceName=auth-service&action=LOGIN&status=SUCCESS&page=0&size=20
Authorization: Bearer {admin_token}
```
**Query Parameters**:
- `serviceName` - Filter by service
- `userId` - Filter by user
- `action` - Filter by action type
- `resourceId` - Filter by resource
- `status` - Filter by status (SUCCESS, FAILURE)
- `startDate` - Start of date range (ISO-8601)
- `endDate` - End of date range (ISO-8601)
- `search` - Full-text search in details
- `page` - Page number (default: 0)
- `size` - Page size (default: 20)

**Access**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
**Response**: `200 OK` (Paginated)

#### Get User Audit Trail
```http
GET /api/audit/logs/user/{userId}?page=0&size=50
Authorization: Bearer {admin_token}
```
**Access**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
**Response**: `200 OK`

#### Get Service Logs
```http
GET /api/audit/logs/service/{serviceName}?page=0&size=50
Authorization: Bearer {admin_token}
```
**Access**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
**Response**: `200 OK`

#### Get Failed Actions
```http
GET /api/audit/logs/failures?page=0&size=50
Authorization: Bearer {admin_token}
```
**Access**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
**Response**: `200 OK`

## Common Audit Actions

### Authentication Actions
- `LOGIN` - User login
- `LOGOUT` - User logout
- `LOGIN_FAILED` - Failed login attempt
- `PASSWORD_RESET` - Password reset
- `REGISTER` - New user registration

### User Management Actions
- `CREATE_USER` - User created
- `UPDATE_USER` - User updated
- `DELETE_USER` - User deleted
- `ASSIGN_ROLE` - Role assigned to user

### Appointment Actions
- `CREATE_APPOINTMENT` - Appointment scheduled
- `UPDATE_APPOINTMENT` - Appointment modified
- `CANCEL_APPOINTMENT` - Appointment cancelled
- `COMPLETE_APPOINTMENT` - Appointment marked complete

### Prescription Actions
- `ISSUE_PRESCRIPTION` - Prescription created
- `VIEW_PRESCRIPTION` - Prescription accessed

### Medical Record Actions
- `UPDATE_MEDICAL_RECORD` - Medical record updated
- `VIEW_MEDICAL_RECORD` - Medical record accessed
- `ADD_CONSULTATION_NOTE` - Clinical note added

## Elasticsearch Configuration

```yaml
spring:
  elasticsearch:
    uris: ${ELASTICSEARCH_URIS:http://elasticsearch:9200}
  data:
    elasticsearch:
      repositories:
        enabled: true
```

### Index Configuration
- **Index Name**: `audit_logs`
- **Shards**: 1 (configurable for production)
- **Replicas**: 1 (configurable for production)
- **Refresh Interval**: 1s (near real-time)

### Query Performance
- **Keyword Fields**: Fast exact-match queries
- **Date Range**: Optimized time-based queries
- **Full-Text Search**: Analyzed text search on details
- **Aggregations**: Fast grouping and counting

## Security Configuration

### OAuth2 Resource Server
- **Issuer URI**: Configurable via `KEYCLOAK_ISSUER_URI`
- **JWK Set URI**: Configurable via `KEYCLOAK_JWK_SET_URI`
- **Role Extraction**: From `realm_access.roles` claim

### Access Control
- **Create Logs**: All authenticated services (internal)
- **Read Logs**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
- **Search/Filter**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`
- **Export**: `ROLE_ADMIN`, `ROLE_RESPONSABLE_SECURITE`

## Integration with Other Services

### How Services Log Audits

#### Via REST API
```java
@Autowired
private RestTemplate restTemplate;

public void logAudit(String action, String resourceId, String details) {
    AuditLogRequest request = AuditLogRequest.builder()
        .serviceName("appointment-service")
        .userId(getCurrentUserId())
        .action(action)
        .resourceId(resourceId)
        .status("SUCCESS")
        .details(details)
        .ipAddress(getClientIp())
        .build();
    
    restTemplate.postForEntity(
        "http://audit-service/api/audit/logs",
        request,
        Void.class
    );
}
```

#### Async Logging (Recommended)
```java
@Async
public void logAuditAsync(AuditLogRequest request) {
    // Non-blocking audit logging
    auditService.logAudit(request);
}
```

## Compliance & Reporting

### GDPR Compliance
- **User Data Access**: Track all access to personal data
- **Data Modifications**: Log all changes to user information
- **Right to be Forgotten**: Audit deletion requests
- **Data Portability**: Log data export requests

### HIPAA Compliance
- **PHI Access**: Track all access to protected health information
- **Minimum Necessary**: Log what data was accessed
- **Audit Controls**: Comprehensive audit trail
- **Integrity Controls**: Detect unauthorized modifications

### Reporting Capabilities
1. **User Activity Reports**: All actions by specific user
2. **Resource Access Reports**: Who accessed specific resources
3. **Failed Access Attempts**: Security monitoring
4. **Service Activity**: Actions by service
5. **Time-Based Analysis**: Activity patterns over time

## Loki Integration

### Log Forwarding
```yaml
loki:
  url: ${LOKI_URL:http://localhost:3100/loki/api/v1/push}
```

### Benefits
- **Centralized Logging**: All application logs in one place
- **Log Correlation**: Link audit logs with application logs
- **Grafana Integration**: Visualize logs in Grafana dashboards

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8085 | Service port |
| `ELASTICSEARCH_URIS` | http://elasticsearch:9200 | Elasticsearch URL |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `EUREKA_URL` | http://discovery-service:8761/eureka/ | Eureka URL |
| `LOKI_URL` | http://localhost:3100/loki/api/v1/push | Loki URL |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-audit-service .
```

### Run Locally
```bash
java -jar target/audit-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d audit-service elasticsearch
```

## API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Service-specific docs**: http://localhost:8080/api/audit/v3/api-docs

## Health & Monitoring
- **Health Check**: http://localhost:8085/actuator/health
- **Metrics**: http://localhost:8085/actuator/metrics
- **Prometheus**: http://localhost:8085/actuator/prometheus

## Elasticsearch Management

### View Index
```bash
curl http://localhost:9200/audit_logs
```

### Search Logs
```bash
curl -X GET "http://localhost:9200/audit_logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "action": "LOGIN"
    }
  }
}
'
```

### Delete Index (Caution!)
```bash
curl -X DELETE "http://localhost:9200/audit_logs"
```

## Best Practices

1. **Async Logging**: Use async methods to avoid blocking operations
2. **Structured Data**: Use consistent field names and values
3. **Sensitive Data**: Don't log passwords or tokens in details
4. **Retention Policy**: Implement log rotation and archival
5. **Monitoring**: Alert on failed actions and unusual patterns
6. **Performance**: Use bulk indexing for high-volume logging
7. **Security**: Restrict access to audit logs to authorized personnel

## Troubleshooting

### Logs Not Appearing
1. Check Elasticsearch connection
2. Verify index exists: `GET http://localhost:9200/audit_logs`
3. Check service logs for errors
4. Verify authentication token is valid

### Slow Queries
1. Add indexes on frequently queried fields
2. Reduce page size
3. Use date range filters to limit results
4. Consider index optimization

### Elasticsearch Connection Issues
1. Verify Elasticsearch is running
2. Check network connectivity
3. Verify `ELASTICSEARCH_URIS` environment variable
4. Check Elasticsearch logs
