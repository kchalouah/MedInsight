package com.medinsight.appointment.controller;

import com.medinsight.appointment.dto.PrescriptionRequest;
import com.medinsight.appointment.dto.PrescriptionResponse;
import com.medinsight.appointment.service.PrescriptionService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Prescriptions", description = "Prescription management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping("/appointments/{appointmentId}/prescriptions")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @Operation(summary = "Issue a prescription", description = "Doctors can issue prescriptions for their appointments")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody PrescriptionRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prescriptionService.createPrescription(appointmentId, request, authentication));
    }

    @GetMapping("/appointments/{appointmentId}/prescriptions")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @Operation(summary = "Get appointment prescriptions", description = "View prescriptions for a specific appointment")
    public ResponseEntity<List<PrescriptionResponse>> getAppointmentPrescriptions(
            @PathVariable UUID appointmentId,
            Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByAppointment(appointmentId, authentication));
    }

    @GetMapping("/prescriptions/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @Operation(summary = "Get patient prescriptions", description = "View all prescriptions for a patient")
    public ResponseEntity<Page<PrescriptionResponse>> getPatientPrescriptions(
            @PathVariable UUID patientId,
            Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getPatientPrescriptions(patientId, pageable, authentication));
    }
}
