# Medical Record Service API Documentation

## Overview
The Medical Record Service centralizes patient health history. It combines internal clinical data (allergies, blood type) with external data (appointments, prescriptions) fetched from the Appointment Service.

## Access via API Gateway (Recommended)
Base URL: `http://localhost:8080/api`

The Gateway strips the `/api` prefix and forwards to the service.

- Records: `http://localhost:8080/api/records/**`

## Direct Access (Development)
Base URL: `http://localhost:8084`

- Records: `http://localhost:8084/records/**`

## Endpoints

### Get Medical Dossier
**Gateway Path:** `GET /api/records/patient/{patientId}/dossier`
**Service Path:** `GET /records/patient/{patientId}/dossier`
**Access:** `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Returns a complete view of the patient's health including:
- Chronic conditions and allergies
- Clinical notes from consultations
- Appointment history (from Appointment Service)
- Prescription history (from Appointment Service)

---

### Update Patient Clinical Data
**Gateway Path:** `PUT /api/records/patient/{patientId}`
**Service Path:** `PUT /records/patient/{patientId}`
**Access:** `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Update permanent health data.

**Request Body:**
```json
{
  "bloodType": "A+",
  "allergies": "Peanuts, Penicillin",
  "chronic_conditions": "Hypertension",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+123456789",
  "medicalHistory": "Surgery in 2018"
}
```

---

### Add Consultation Note
**Gateway Path:** `POST /api/records/notes`
**Service Path:** `POST /records/notes`
**Access:** `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Link a new clinical note to a specific appointment.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "patientId": "uuid",
  "noteContent": "Patient shows improvement..."
}
```

## Internal Communication
This service uses **OpenFeign** to communicate with the `appointment-service`.
- Interface: `AppointmentClient`
- Fetches: `/api/appointments/patient/{id}` and `/api/prescriptions/patient/{id}`
