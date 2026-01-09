# MedInsight Mail Service

The **Mail Service** is a centralized notification hub for the MedInsight platform, handling SMTP-based email delivery for prescriptions, reminders, and system alerts.

## Tech Stack
- **Spring Boot 3.x**
- **Java Mail Sender** (Gmail SMTP)
- **Thymeleaf** (HTML Templating)
- **Eureka Client** (Service Discovery)
- **Keycloak** (JWT Security)

## Gmail SMTP Setup
To use Gmail with this service:
1.  Enable **2-Step Verification** in your Google Account.
2.  Create an **App Password**:
    *   Go to Security settings -> 2-Step Verification.
    *   Scroll to the bottom -> App Passwords.
    *   Select "Other" (Name it 'MedInsight') and click 'Generate'.
3.  Use this 16-character code as `SMTP_PASSWORD` in your configuration.

## Endpoints

### 1. Send Simple Email
`POST /api/mail/send`
```json
{
  "to": "patient@example.com",
  "subject": "Sujet de l'email",
  "body": "Contenu du message",
  "html": false
}
```

### 2. Send Appointment Reminder
`POST /api/mail/send-appointment-reminder`
```json
{
  "to": "patient@example.com",
  "patientName": "Jean Dupont",
  "appointmentDate": "2026-01-15",
  "appointmentTime": "14:30",
  "doctorName": "Dr. Smith",
  "location": "Cabinet Médical Central"
}
```

## Setup & Run
1.  Build: `mvn clean package -pl mail-service -am`
2.  Run with Docker: `docker-compose up -d mail-service`
