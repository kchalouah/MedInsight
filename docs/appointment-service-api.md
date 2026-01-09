# Appointment Service API Documentation

## Overview
The Appointment Service manages medical appointments between patients and doctors. It provides endpoints for scheduling, viewing, updating, and cancelling appointments with role-based access control.

## Base URL
Through Gateway: `http://localhost:8080/api/appointments`
Direct (internal): `http://localhost:8082/api/appointments`

## Authentication
Requires a valid JWT token from Keycloak. The token must contain appropriate realm roles: `ROLE_PATIENT`, `ROLE_MEDECIN`, or `ROLE_ADMIN`.

## Endpoints

### 1. Create Appointment
**Endpoint:** `POST /`
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

### 2. Get Appointment by ID
**Endpoint:** `GET /{id}`
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

## Prescription Management

Prescriptions are medical orders issued by doctors for patients during appointments.

### 1. Issue a Prescription
**Endpoint:** `POST /api/appointments/{appointmentId}/prescriptions`
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
**Endpoint:** `GET /api/appointments/{appointmentId}/prescriptions`
**Access:** `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** View all prescriptions issued for a specific appointment.

---

### 3. Get Patient Prescription History
**Endpoint:** `GET /api/prescriptions/patient/{patientId}`
**Access:** `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Paginated history of all prescriptions for a patient across all appointments.
