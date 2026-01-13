# Appointment Service API Documentation

## Overview
The Appointment Service manages medical appointments between patients and doctors. It provides endpoints for scheduling, viewing, updating, and cancelling appointments with role-based access control.

## Base URLs

### Access via API Gateway (Recommended)
Base URL: `http://localhost:8080/api`

The Gateway strips the `/api` prefix and forwards to the service.

- Appointments: `http://localhost:8080/api/appointments/**`
- Prescriptions: `http://localhost:8080/api/prescriptions/**`

### Direct Access (Development)
Base URL: `http://localhost:8082`

- Appointments: `http://localhost:8082/appointments/**`
- Prescriptions: `http://localhost:8082/prescriptions/**`

Requires a valid JWT token from Keycloak. The token must contain appropriate realm roles: `ROLE_PATIENT`, `ROLE_MEDECIN`, or `ROLE_ADMIN`.

> [!IMPORTANT]
> **Role Case Sensitivity**: All roles are now standardized to **UPPERCASE** (e.g., `ROLE_ADMIN`). The backend automatically converts roles for comparison.

## Endpoints

### Create Appointment
**Gateway Path:** `POST /api/appointments`
**Service Path:** `POST /appointments`
**Access:** `ROLE_PATIENT`, `ROLE_ADMIN`
**Description:** Patients can schedule an appointment for themselves. Admins can schedule for anyone.

**Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "appointmentDateTime": "2024-12-25T10:00:00",
  "reason": "General checkup",
  "notes": "Patient reports minor headache"
}
```

**Response:** `201 Created`

---

### Get Appointment by ID
**Gateway Path:** `GET /api/appointments/{id}`
**Service Path:** `GET /appointments/{id}`
**Access:** `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Get details of a specific appointment. Patients can only see their own, doctors can only see their assigned appointments.

**Response:** `200 OK`

---

### 3. Update Appointment
**Endpoint:** `PUT /{id}`
**Access:** `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Update appointment details or status. Patients can cancel their own. Doctors can complete/update their assigned appointments.

**Request Body:**
```json
{
  "appointmentDateTime": "2024-12-25T11:00:00",
  "status": "COMPLETED",
  "reason": "Updated reason",
  "notes": "Post-consultation notes"
}
```

**Response:** `200 OK`

---

### 4. List Appointments (with Filters)
**Endpoint:** `GET /`
**Access:** `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** List appointments with optional filters for patientId, doctorId, status, and date range.

**Query Parameters:**
- `patientId`: Filter by patient UUID
- `doctorId`: Filter by doctor UUID
- `status`: Filter by status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- `startDate`: Start of date range (ISO-8601)
- `endDate`: End of date range (ISO-8601)

**Response:** `200 OK (Paginated)`

---

### 5. List Patient Appointments
**Endpoint:** `GET /patient/{patientId}`
**Access:** `ROLE_PATIENT`, `ROLE_ADMIN`
**Description:** Get all appointments for a specific patient.

---

### 6. List Doctor Appointments
**Endpoint:** `GET /doctor/{doctorId}`
**Access:** `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Get all appointments for a specific doctor.

---

## Status Enums
- `SCHEDULED`: Appointment is confirmed and pending.
- `COMPLETED`: Appointment has taken place.
- `CANCELLED`: Appointment was cancelled.
- `NO_SHOW`: Patient did not attend the scheduled appointment.

## Error Responses
- `400 Bad Request`: Validation failure or malformed request.
- `401 Unauthorized`: Authentication missing or invalid.
- `403 Forbidden`: Insufficient permissions to access or modify the resource.
- `404 Not Found`: Appointment does not exist.
- `409 Conflict`: Appointment time conflict (e.g., doctor already booked).

---

## Internal Communication
This service uses **OpenFeign** to communicate with the `appointment-service`.
- Interface: `AppointmentClient`
- Fetches: `/appointments/patient/{id}` and `/prescriptions/patient/{id}` (Standardized paths)

---

## Prescription Management

Prescriptions are medical orders issued by doctors for patients during appointments.

### Issue Prescription
**Gateway Path:** `POST /api/appointments/{appointmentId}/prescriptions`
**Service Path:** `POST /appointments/{appointmentId}/prescriptions`
**Access:** `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Issued by the assigned doctor or admin.

**Request Body:**
```json
{
  "patientId": "uuid",
  "medicationName": "Amoxicillin",
  "dosage": "500mg, 3 times daily",
  "duration": "7 days",
  "instructions": "Take after meals"
}
```

**Response:** `201 Created`

---

### 2. Get Appointment Prescriptions
**Gateway Path:** `GET /api/appointments/{appointmentId}/prescriptions`
**Service Path:** `GET /appointments/{appointmentId}/prescriptions`
**Access:** `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** View all prescriptions issued for a specific appointment.

---

### 3. Get Patient Prescription History
**Gateway Path:** `GET /api/prescriptions/patient/{patientId}`
**Service Path:** `GET /prescriptions/patient/{patientId}`
**Access:** `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Paginated history of all prescriptions for a patient across all appointments.
