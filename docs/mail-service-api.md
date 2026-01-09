# Mail Service API Documentation

## Overview
The Mail Service handles all outbound email communication for the MedInsight platform.

## Base URL
Through Gateway: `http://localhost:8080/api/mail`
Direct (internal): `http://localhost:8087/api/mail`

## Endpoints

### 1. Send Simple Mail
**POST** `/send`
- **Access**: `ROLE_ADMIN`, `ROLE_MEDECIN`, `ROLE_GESTIONNAIRE`
- **Description**: Sends a basic text or HTML email.

### 2. Send Appointment Reminder
**POST** `/send-appointment-reminder`
- **Access**: Internal services (Appointment Service)
- **Description**: Uses the `appointment-reminder.html` Thymeleaf template.

## Environment Variables
- `SMTP_HOST`: Gmail SMTP host (default: `smtp.gmail.com`).
- `SMTP_PORT`: SMTP port (default: `587`).
- `SMTP_USERNAME`: Sender email address.
- `SMTP_PASSWORD`: Gmail App Password.
- `KEYCLOAK_ISSUER_URI`: Identity provider issuer.
