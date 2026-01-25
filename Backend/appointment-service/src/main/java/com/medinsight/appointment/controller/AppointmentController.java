package com.medinsight.appointment.controller;

import com.medinsight.appointment.dto.*;
import com.medinsight.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medinsight.appointment.entity.AppointmentStatus;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for appointment management endpoints.
 */
@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Appointments", description = "Appointment management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Create a new appointment", description = "Patients can create appointments for themselves, admins can create for anyone")
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication authentication) {
        log.info("Creating appointment for patient {} with doctor {}", request.getPatientId(), request.getDoctorId());
        AppointmentResponse response = appointmentService.createAppointment(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get appointment by ID", description = "Get appointment details")
    public ResponseEntity<AppointmentResponse> getAppointment(
            @PathVariable UUID id,
            Authentication authentication) {
        log.info("Fetching appointment with ID: {}", id);
        AppointmentResponse response = appointmentService.getAppointment(id, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Update appointment", description = "Update appointment details")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody AppointmentUpdateRequest request,
            Authentication authentication) {
        log.info("Updating appointment with ID: {}", id);
        AppointmentResponse response = appointmentService.updateAppointment(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @Operation(summary = "Delete appointment", description = "Delete an appointment")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable UUID id,
            Authentication authentication) {
        log.info("Deleting appointment with ID: {}", id);
        appointmentService.deleteAppointment(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get appointments with filters", description = "Get paginated list of appointments with optional filters")
    public ResponseEntity<Page<AppointmentResponse>> getAppointments(
            @ModelAttribute AppointmentFilterRequest filter,
            Pageable pageable,
            Authentication authentication) {
        log.info("Fetching appointments with filters");
        Page<AppointmentResponse> response = appointmentService.getAppointments(filter, pageable, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get patient appointments", description = "Get all appointments for a specific patient")
    public ResponseEntity<Page<AppointmentResponse>> getPatientAppointments(
            @PathVariable UUID patientId,
            Pageable pageable,
            Authentication authentication) {
        log.info("Fetching appointments for patient: {}", patientId);
        Page<AppointmentResponse> response = appointmentService.getPatientAppointments(patientId, pageable,
                authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get doctor appointments", description = "Get all appointments for a specific doctor")
    public ResponseEntity<Page<AppointmentResponse>> getDoctorAppointments(
            @PathVariable UUID doctorId,
            Pageable pageable,
            Authentication authentication) {
        log.info("Fetching appointments for doctor: {}", doctorId);
        Page<AppointmentResponse> response = appointmentService.getDoctorAppointments(doctorId, pageable,
                authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('MEDECIN')")
    @Operation(summary = "Complete consultation", description = "Mark appointment as completed (doctors only)")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> notes,
            Authentication authentication) {
        log.info("Completing consultation for appointment: {}", id);

        AppointmentUpdateRequest updateRequest = new AppointmentUpdateRequest();
        updateRequest.setStatus(AppointmentStatus.COMPLETED);
        if (notes != null && notes.containsKey("notes")) {
            updateRequest.setNotes(notes.get("notes"));
        }

        AppointmentResponse response = appointmentService.updateAppointment(id, updateRequest, authentication);
        return ResponseEntity.ok(response);
    }
}
