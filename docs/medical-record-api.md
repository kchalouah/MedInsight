# Medical Record Service API Documentation

## Overview
The Medical Record Service centralizes patient health history. It combines internal clinical data (allergies, blood type) with external data (appointments, prescriptions) fetched from the Appointment Service.

## Base URL
Through Gateway: `http://localhost:8080/api/records`
Direct (internal): `http://localhost:8084/api/records`

## Endpoints

### 1. Get Unified Medical Dossier
**Endpoint:** `GET /patient/{patientId}/dossier`
**Access:** `ROLE_PATIENT` (self), `ROLE_MEDECIN`, `ROLE_ADMIN`
**Description:** Returns a complete view of the patient's health including:
- Chronic conditions and allergies
- Clinical notes from consultations
- Appointment history (from Appointment Service)
- Prescription history (from Appointment Service)

---

### 2. Update Patient Clinical Data
**Endpoint:** `PUT /patient/{patientId}`
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

### 3. Add Consultation Note
**Endpoint:** `POST /notes`
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
