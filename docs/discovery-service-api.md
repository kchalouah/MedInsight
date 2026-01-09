# Discovery Service API Documentation

## Overview

The Discovery Service is a Netflix Eureka Server that provides service registration and discovery for the MedInsight microservices architecture. It enables dynamic service-to-service communication without hardcoded URLs.

## Base URL

```
http://localhost:8761
```

## Eureka Dashboard

**URL**: http://localhost:8761

**Description**: Web-based dashboard showing all registered services, their instances, and health status.

**Features**:
- View all registered services
- Monitor service health
- See instance metadata
- View renewal statistics
- Check last heartbeat times

---

## Eureka REST API

### Get All Applications

**Endpoint**: `GET /eureka/apps`

**Description**: Retrieve information about all registered applications.

**Response**: `200 OK`

```xml
<applications>
  <application>
    <name>AUTH-SERVICE</name>
    <instance>
      <instanceId>auth-service:8081</instanceId>
      <hostName>auth-service</hostName>
      <app>AUTH-SERVICE</app>
      <ipAddr>172.18.0.5</ipAddr>
      <status>UP</status>
      <port enabled="true">8081</port>
      <healthCheckUrl>http://auth-service:8081/actuator/health</healthCheckUrl>
    </instance>
  </application>
</applications>
```

---

### Get Specific Application

**Endpoint**: `GET /eureka/apps/{appName}`

**Description**: Retrieve information about a specific registered application.

**Path Parameters**:
- `appName` - Application name (e.g., AUTH-SERVICE)

**Example**:
```
GET /eureka/apps/AUTH-SERVICE
```

**Response**: `200 OK`

---

### Get Application Instance

**Endpoint**: `GET /eureka/apps/{appName}/{instanceId}`

**Description**: Retrieve information about a specific instance of an application.

**Path Parameters**:
- `appName` - Application name
- `instanceId` - Instance identifier

---

### Register Instance

**Endpoint**: `POST /eureka/apps/{appName}`

**Description**: Register a new service instance (typically done automatically by Eureka clients).

**Request Body**: Instance metadata (JSON or XML)

---

### Send Heartbeat

**Endpoint**: `PUT /eureka/apps/{appName}/{instanceId}`

**Description**: Send heartbeat to indicate instance is still alive (done automatically by Eureka clients).

---

### Deregister Instance

**Endpoint**: `DELETE /eureka/apps/{appName}/{instanceId}`

**Description**: Deregister a service instance.

---

## Actuator Endpoints

### Health Check

**Endpoint**: `GET /actuator/health`

**Description**: Check the health status of the Eureka server.

**Response**: `200 OK`

```json
{
  "status": "UP"
}
```

---

### Application Info

**Endpoint**: `GET /actuator/info`

**Description**: Get application information.

**Response**: `200 OK`

```json
{
  "app": {
    "name": "discovery-service",
    "description": "Eureka Discovery Server"
  }
}
```

---

## Client Configuration

### Spring Boot Microservice Registration

To register a microservice with this Eureka server, add to `application.yml`:

```yaml
spring:
  application:
    name: your-service-name

eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://discovery-service:8761/eureka/
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${random.value}
```

### Maven Dependency

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

---

## Monitoring

### Registered Services

The Eureka dashboard shows:
- **Application Name**: Logical name of the service
- **AMIs**: Number of instances
- **Availability Zones**: Where instances are running
- **Status**: UP, DOWN, OUT_OF_SERVICE, UNKNOWN

### Instance Details

For each instance:
- **Instance ID**: Unique identifier
- **Status**: Current health status
- **IP Address**: Instance IP
- **Port**: Service port
- **Last Heartbeat**: Time of last renewal
- **Metadata**: Custom metadata

---

## Configuration

### Server Configuration

```yaml
server:
  port: 8761

eureka:
  instance:
    hostname: discovery-service
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

### Self-Preservation Mode

Eureka enters self-preservation mode when it detects that a large number of instances have failed to renew their leases. This prevents mass deregistration due to network issues.

**Disable in development**:
```yaml
eureka:
  server:
    enable-self-preservation: false
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/discovery-service-*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
discovery-service:
  build: ./Backend/discovery-service
  ports:
    - "8761:8761"
  networks:
    - medinsight-network
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:8761/actuator/health"]
    interval: 30s
    timeout: 5s
    retries: 5
```

---

## Troubleshooting

### Service Not Appearing

**Problem**: Registered service doesn't appear in Eureka dashboard

**Solutions**:
1. Check service logs for registration errors
2. Verify `eureka.client.service-url.defaultZone` is correct
3. Ensure network connectivity between service and Eureka
4. Check if service is sending heartbeats

### Service Shows as DOWN

**Problem**: Service appears in dashboard but status is DOWN

**Solutions**:
1. Check service health endpoint
2. Verify health check URL is accessible
3. Review service logs for errors
4. Ensure service is actually running

### Self-Preservation Mode

**Problem**: Eureka enters self-preservation mode

**Solutions**:
1. Check network connectivity
2. Review heartbeat renewal configuration
3. Disable in development: `eureka.server.enable-self-preservation=false`

---

## Best Practices

1. **Use Meaningful Service Names**: Use descriptive, uppercase names (e.g., AUTH-SERVICE, PATIENT-SERVICE)
2. **Enable Health Checks**: Configure actuator health endpoints
3. **Set Instance IDs**: Use unique instance IDs for multiple instances
4. **Configure Timeouts**: Adjust lease renewal and expiration based on your needs
5. **Monitor Dashboard**: Regularly check the Eureka dashboard for service health

---

## Summary

The Discovery Service provides:
- ✅ Centralized service registry
- ✅ Dynamic service discovery
- ✅ Health monitoring
- ✅ Load balancing support
- ✅ Web-based dashboard
- ✅ REST API for programmatic access
