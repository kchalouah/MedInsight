# Discovery Service (Eureka Server)

## Overview
The **Discovery Service** is the service registry for the MedInsight microservices architecture. It uses Netflix Eureka Server to enable service discovery, allowing microservices to find and communicate with each other dynamically.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Service Discovery**: Netflix Eureka Server
- **Language**: Java 17

### Port Configuration
- **Service Port**: 8761
- **Dashboard**: http://localhost:8761

## Key Features

1. **Service Registration**: Microservices register themselves on startup
2. **Service Discovery**: Services can discover other services by name
3. **Health Monitoring**: Tracks health status of registered services
4. **Load Balancing**: Provides instance information for client-side load balancing
5. **Self-Preservation**: Protects against network partition issues
6. **Dashboard**: Web UI for monitoring registered services

## Configuration

### Eureka Server Configuration
```yaml
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false  # Don't register itself
    fetch-registry: false         # Don't fetch registry
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
  server:
    enable-self-preservation: true
    eviction-interval-timer-in-ms: 60000
```

### Self-Preservation Mode
- **Purpose**: Prevents mass de-registration during network issues
- **Threshold**: 85% of services must send heartbeats
- **Behavior**: When triggered, stops evicting services even if heartbeats are missed
- **Production**: Should be enabled
- **Development**: Can be disabled for faster feedback

## Service Registration

### How Services Register
Microservices include Eureka Client dependency and configure:

```yaml
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

### Registration Process
1. Service starts up
2. Sends registration request to Eureka Server
3. Eureka Server stores service metadata
4. Service sends heartbeats every 30 seconds (default)
5. If heartbeats stop, service is evicted after 90 seconds

## Registered Services

### MedInsight Services
The following services register with Eureka:

| Service Name | Port | Instances | Description |
|--------------|------|-----------|-------------|
| `gateway-service` | 8080 | 1+ | API Gateway |
| `auth-service` | 8081 | 1+ | Authentication & User Management |
| `appointment-service` | 8082 | 1+ | Appointments & Prescriptions |
| `medical-record-service` | 8084 | 1+ | Medical Records & Dossiers |
| `audit-service` | 8085 | 1+ | Audit Logging |
| `ml-service` | 8086 | 1+ | Machine Learning Predictions |
| `mail-service` | 8087 | 1+ | Email Notifications |

## Service Discovery

### How Services Discover Each Other

#### Using RestTemplate
```java
@LoadBalanced
@Bean
public RestTemplate restTemplate() {
    return new RestTemplate();
}

// Usage
String url = "http://auth-service/api/internal/users/{id}";
User user = restTemplate.getForObject(url, User.class, userId);
```

#### Using WebClient (Reactive)
```java
@LoadBalanced
@Bean
public WebClient.Builder webClientBuilder() {
    return WebClient.builder();
}

// Usage
webClientBuilder.build()
    .get()
    .uri("http://appointment-service/api/appointments/{id}", appointmentId)
    .retrieve()
    .bodyToMono(Appointment.class);
```

#### Using OpenFeign
```java
@FeignClient(name = "appointment-service")
public interface AppointmentClient {
    @GetMapping("/api/appointments/patient/{patientId}")
    List<Appointment> getPatientAppointments(@PathVariable UUID patientId);
}
```

## Eureka Dashboard

### Accessing the Dashboard
**URL**: http://localhost:8761

### Dashboard Information
- **System Status**: Eureka server health and configuration
- **DS Replicas**: Peer Eureka servers (if clustered)
- **Instances Currently Registered**: List of all registered services
- **General Info**: Lease renewal/expiration settings
- **Instance Info**: Detailed information about each service instance

### Instance Information Displayed
- **Application Name**: Service name
- **Status**: UP, DOWN, STARTING, OUT_OF_SERVICE
- **Availability Zones**: Deployment zones
- **Instance ID**: Unique identifier
- **Home Page URL**: Service home page
- **Health Check URL**: Health endpoint
- **Status Page URL**: Status endpoint

## Health Monitoring

### Heartbeat Mechanism
- **Interval**: 30 seconds (default)
- **Timeout**: 90 seconds (3 missed heartbeats)
- **Renewal Threshold**: 85% of services must renew

### Health Check Integration
Services can provide custom health checks:

```yaml
eureka:
  client:
    healthcheck:
      enabled: true
```

Spring Boot Actuator health endpoint is used:
```
GET /actuator/health
```

## High Availability

### Clustering Eureka Servers
For production, run multiple Eureka instances:

```yaml
# Eureka Server 1
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server-2:8761/eureka/,http://eureka-server-3:8761/eureka/

# Eureka Server 2
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server-1:8761/eureka/,http://eureka-server-3:8761/eureka/
```

### Benefits
- **Fault Tolerance**: If one Eureka server fails, others continue
- **Load Distribution**: Registration load is distributed
- **Data Replication**: Service registry is replicated across instances

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8761 | Eureka server port |
| `EUREKA_INSTANCE_HOSTNAME` | localhost | Eureka hostname |

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-discovery-service .
```

### Run Locally
```bash
java -jar target/discovery-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d discovery-service
```

## Troubleshooting

### Service Not Appearing in Eureka
1. Check service configuration for `register-with-eureka: true`
2. Verify Eureka URL is correct
3. Check network connectivity
4. Review service logs for registration errors
5. Ensure service is sending heartbeats

### Self-Preservation Mode Triggered
- **Symptom**: Warning message in Eureka dashboard
- **Cause**: Network issues or too many services down
- **Solution**: Fix network issues or restart affected services
- **Development**: Can disable with `enable-self-preservation: false`

### Service Instances Not Removed
- **Cause**: Self-preservation mode active
- **Solution**: Wait for heartbeat timeout or restart Eureka
- **Prevention**: Ensure services send proper shutdown signals

## Security Considerations

### Production Recommendations
1. **Enable Authentication**: Protect Eureka dashboard
2. **Use HTTPS**: Encrypt service registry communication
3. **Network Isolation**: Run Eureka in private network
4. **Access Control**: Limit who can register services
5. **Monitoring**: Alert on unusual registration patterns

### Basic Authentication (Optional)
```yaml
spring:
  security:
    user:
      name: admin
      password: ${EUREKA_PASSWORD}
```

## Monitoring & Metrics

### Health Check
```
GET http://localhost:8761/actuator/health
```

### Metrics
```
GET http://localhost:8761/actuator/metrics
```

### Key Metrics to Monitor
- Number of registered instances
- Heartbeat renewal rate
- Self-preservation mode status
- Memory usage
- CPU usage

## Best Practices

1. **High Availability**: Run multiple Eureka instances in production
2. **Health Checks**: Enable health check integration
3. **Proper Shutdown**: Ensure services de-register gracefully
4. **Monitoring**: Monitor Eureka health and registered services
5. **Network Reliability**: Ensure stable network between services and Eureka
6. **Timeouts**: Configure appropriate timeouts for your environment
7. **Self-Preservation**: Enable in production, consider disabling in development

## Integration with MedInsight

### Service Communication Flow
```
1. Service A starts → Registers with Eureka
2. Service B starts → Registers with Eureka
3. Service A needs to call Service B
4. Service A queries Eureka for "service-b" instances
5. Eureka returns list of available instances
6. Service A selects instance (load balancing)
7. Service A makes HTTP call to selected instance
```

### Benefits for MedInsight
- **Dynamic Scaling**: Add/remove service instances without configuration changes
- **Fault Tolerance**: Automatic removal of failed instances
- **Load Balancing**: Distribute requests across healthy instances
- **Service Abstraction**: Services communicate by name, not IP address
- **Simplified Configuration**: No need to hardcode service locations
