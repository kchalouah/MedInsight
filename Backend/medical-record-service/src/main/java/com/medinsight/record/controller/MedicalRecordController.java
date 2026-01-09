package com.medinsight.record.controller;

import com.medinsight.record.dto.*;
import com.medinsight.record.service.RecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Medical Records", description = "Patient dossier and clinical notes management")
@SecurityRequirement(name = "bearer-jwt")
public class MedicalRecordController {

    private final RecordService recordService;

    @GetMapping("/patient/{patientId}/dossier")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get detailed medical dossier", description = "Aggregates clinical data, notes, past appointments, and prescriptions")
    public ResponseEntity<MedicalDossierResponse> getMedicalDossier(
            @PathVariable UUID patientId,
            Authentication authentication) {
        
        validatePatientAccess(patientId, authentication);
        return ResponseEntity.ok(recordService.getDetailedDossier(patientId, authentication));
    }

    @PutMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Update patient clinical data", description = "Update allergies, blood type, and medical history")
    public ResponseEntity<PatientMedicalRecordResponse> updateMedicalRecord(
            @PathVariable UUID patientId,
            @RequestBody MedicalRecordRequest request) {
        return ResponseEntity.ok(recordService.updateMedicalRecord(patientId, request));
    }

    @PostMapping("/notes")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @Operation(summary = "Add consultation note", description = "Add a clinical note linked to an appointment")
    public ResponseEntity<ConsultationNoteResponse> addConsultationNote(
            @Valid @RequestBody ConsultationNoteRequest request,
            Authentication authentication) {
        
        UUID doctorId = getUserIdFromAuth(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recordService.addConsultationNote(request, doctorId));
    }

    private void validatePatientAccess(UUID patientId, Authentication authentication) {
        // Patients can only see their own dossier
        String roles = authentication.getAuthorities().toString();
        if (roles.contains("ROLE_PATIENT")) {
            UUID authId = getUserIdFromAuth(authentication);
            if (!authId.equals(patientId)) {
                throw new RuntimeException("Access Denied: You can only view your own record");
            }
        }
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            try {
                return UUID.fromString(sub);
            } catch (IllegalArgumentException e) {
                return UUID.nameUUIDFromBytes(sub.getBytes());
            }
        }
        throw new RuntimeException("Invalid authentication");
    }
}
