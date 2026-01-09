# Mail Service

## Overview
The **Mail Service** handles email notifications for the MedInsight platform. It provides a centralized email sending capability for appointment confirmations, password resets, and other transactional emails.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Email**: Spring Mail (SMTP)
- **Template Engine**: Thymeleaf
- **Authentication**: OAuth2/JWT via Keycloak
- **Service Discovery**: Netflix Eureka
- **API Documentation**: SpringDoc OpenAPI 3

### Port Configuration
- **Service Port**: 8087
- **Eureka Discovery**: 8761
- **Gateway Access**: http://localhost:8080/api/mail

## Key Features

1. **Transactional Emails**: Appointment confirmations, reminders, notifications
2. **Template Support**: HTML email templates with Thymeleaf
3. **Async Processing**: Non-blocking email sending
4. **Error Handling**: Retry logic for failed sends
5. **Multi-Recipient**: Support for CC and BCC
6. **Attachments**: Support for file attachments
7. **Audit Integration**: Logs all email operations

## Service Layer

### Key Services

#### MailService
**Methods**:
- `sendSimpleEmail(String to, String subject, String body)` - Send plain text email
  - Basic email without templates
  - Quick notifications
  
- `sendHtmlEmail(String to, String subject, String htmlBody)` - Send HTML email
  - Rich formatted emails
  - Custom HTML content
  
- `sendTemplateEmail(EmailRequest request)` - Send templated email
  - Uses Thymeleaf templates
  - Dynamic content injection
  - Professional formatting
  
- `sendEmailWithAttachment(EmailRequest request, MultipartFile attachment)` - Send with attachment
  - Supports multiple file types
  - Size validation
  
- `sendBulkEmail(List<String> recipients, String subject, String body)` - Send to multiple recipients
  - Batch processing
  - Individual delivery

### Email Templates

#### Available Templates
1. **appointment-confirmation.html** - Appointment booking confirmation
2. **appointment-reminder.html** - Appointment reminder (24h before)
3. **appointment-cancellation.html** - Cancellation notification
4. **password-reset.html** - Password reset link
5. **welcome.html** - New user welcome email
6. **prescription-ready.html** - Prescription notification

#### Template Variables
Templates use Thymeleaf syntax for dynamic content:
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
    <h1>Hello, <span th:text="${patientName}">Patient</span>!</h1>
    <p>Your appointment with Dr. <span th:text="${doctorName}">Doctor</span> 
       is confirmed for <span th:text="${appointmentDate}">Date</span>.</p>
</body>
</html>
```

## REST API Endpoints

### Email Endpoints

#### Send Simple Email
```http
POST /api/mail/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "patient@example.com",
  "subject": "Appointment Confirmation",
  "body": "Your appointment is confirmed for tomorrow at 10:00 AM."
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`, `ROLE_GESTIONNAIRE`
**Response**: `202 Accepted`

#### Send HTML Email
```http
POST /api/mail/send/html
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "patient@example.com",
  "subject": "Appointment Reminder",
  "htmlBody": "<h1>Reminder</h1><p>Your appointment is tomorrow.</p>"
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`, `ROLE_GESTIONNAIRE`
**Response**: `202 Accepted`

#### Send Templated Email
```http
POST /api/mail/send/template
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "patient@example.com",
  "subject": "Appointment Confirmation",
  "templateName": "appointment-confirmation",
  "templateVariables": {
    "patientName": "John Doe",
    "doctorName": "Dr. Smith",
    "appointmentDate": "2024-12-25 10:00 AM",
    "appointmentLocation": "MedInsight Clinic, Room 301"
  }
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`, `ROLE_GESTIONNAIRE`
**Response**: `202 Accepted`

#### Send Email with Attachment
```http
POST /api/mail/send/attachment
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "to": "patient@example.com",
  "subject": "Lab Results",
  "body": "Please find your lab results attached.",
  "attachment": [file]
}
```
**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`
**Response**: `202 Accepted`

## SMTP Configuration

### Gmail SMTP (Default)
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
    default-encoding: UTF-8
```

### Other SMTP Providers

#### SendGrid
```yaml
spring:
  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
```

#### Amazon SES
```yaml
spring:
  mail:
    host: email-smtp.us-east-1.amazonaws.com
    port: 587
    username: ${AWS_SES_USERNAME}
    password: ${AWS_SES_PASSWORD}
```

#### Custom SMTP
```yaml
spring:
  mail:
    host: ${SMTP_HOST}
    port: ${SMTP_PORT}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
```

## Email Request DTO

### EmailRequest
```java
public class EmailRequest {
    private String to;              // Required
    private String cc;              // Optional
    private String bcc;             // Optional
    private String subject;         // Required
    private String body;            // For simple emails
    private String htmlBody;        // For HTML emails
    private String templateName;    // For template emails
    private Map<String, Object> templateVariables;  // Template data
}
```

## Async Email Processing

### Configuration
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("mail-");
        executor.initialize();
        return executor;
    }
}
```

### Async Method
```java
@Async
public CompletableFuture<Boolean> sendEmailAsync(EmailRequest request) {
    try {
        sendEmail(request);
        return CompletableFuture.completedFuture(true);
    } catch (Exception e) {
        return CompletableFuture.completedFuture(false);
    }
}
```

## Error Handling

### Retry Logic
```java
@Retryable(
    value = {MailException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 2000)
)
public void sendEmail(EmailRequest request) {
    // Email sending logic
}
```

### Exception Types
- `MailAuthenticationException` - SMTP authentication failed
- `MailSendException` - Failed to send email
- `MailParseException` - Invalid email format
- `MailPreparationException` - Template processing failed

### Error Response
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Failed to send email: SMTP authentication failed",
  "path": "/api/mail/send"
}
```

## Integration with Other Services

### Appointment Service Integration
```java
// When appointment is created
@Autowired
private MailService mailService;

public void onAppointmentCreated(Appointment appointment) {
    EmailRequest email = EmailRequest.builder()
        .to(appointment.getPatientEmail())
        .subject("Appointment Confirmation")
        .templateName("appointment-confirmation")
        .templateVariables(Map.of(
            "patientName", appointment.getPatientName(),
            "doctorName", appointment.getDoctorName(),
            "appointmentDate", appointment.getDateTime()
        ))
        .build();
    
    mailService.sendTemplateEmail(email);
}
```

### Auth Service Integration
```java
// Password reset
public void sendPasswordResetEmail(String email, String resetToken) {
    String resetLink = "https://medinsight.com/reset-password?token=" + resetToken;
    
    EmailRequest request = EmailRequest.builder()
        .to(email)
        .subject("Password Reset Request")
        .templateName("password-reset")
        .templateVariables(Map.of("resetLink", resetLink))
        .build();
    
    mailService.sendTemplateEmail(request);
}
```

## Security Configuration

### OAuth2 Resource Server
- **Issuer URI**: Configurable via `KEYCLOAK_ISSUER_URI`
- **Role Extraction**: From `realm_access.roles` claim

### Access Control
- **Send Email**: `ROLE_MEDECIN`, `ROLE_ADMIN`, `ROLE_GESTIONNAIRE`
- **Send with Attachment**: `ROLE_MEDECIN`, `ROLE_ADMIN`
- **Bulk Send**: `ROLE_ADMIN` only

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8087 | Service port |
| `SMTP_HOST` | smtp.gmail.com | SMTP server host |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_USERNAME` | - | SMTP username/email |
| `SMTP_PASSWORD` | - | SMTP password/app password |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `EUREKA_URL` | http://discovery-service:8761/eureka/ | Eureka URL |

## Gmail App Password Setup

### Steps
1. Enable 2-Factor Authentication on Gmail account
2. Go to Google Account → Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate new app password for "Mail"
5. Use generated password as `SMTP_PASSWORD`

## Build & Run

### Maven Build
```bash
mvn clean package -DskipTests
```

### Docker Build
```bash
docker build -t medinsight-mail-service .
```

### Run Locally
```bash
java -jar target/mail-service-1.0.0.jar
```

### Docker Compose
```bash
docker-compose up -d mail-service
```

## API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Service-specific docs**: http://localhost:8080/api/mail/v3/api-docs

## Health & Monitoring
- **Health Check**: http://localhost:8087/actuator/health
- **Metrics**: http://localhost:8087/actuator/metrics

## Best Practices

1. **Use Templates**: Consistent branding and formatting
2. **Async Sending**: Don't block API responses
3. **Error Handling**: Implement retry logic
4. **Rate Limiting**: Prevent spam and abuse
5. **Unsubscribe**: Include unsubscribe links for marketing emails
6. **Testing**: Use test SMTP servers during development
7. **Monitoring**: Track send success/failure rates
8. **Security**: Never log email passwords
9. **Validation**: Validate email addresses before sending
10. **Audit**: Log all email operations

## Testing

### Using Mailtrap (Development)
```yaml
spring:
  mail:
    host: smtp.mailtrap.io
    port: 2525
    username: ${MAILTRAP_USERNAME}
    password: ${MAILTRAP_PASSWORD}
```

### Using MailHog (Local)
```yaml
spring:
  mail:
    host: localhost
    port: 1025
```

## Troubleshooting

### Email Not Sending
1. Verify SMTP credentials
2. Check network connectivity to SMTP server
3. Review service logs for errors
4. Test SMTP connection manually
5. Check spam folder

### Authentication Failed
1. Verify username/password
2. For Gmail, use App Password not account password
3. Enable "Less secure app access" (not recommended)
4. Check 2FA settings

### Template Not Found
1. Verify template name matches file name
2. Check templates directory exists
3. Ensure template file has .html extension
4. Review classpath configuration
