package com.medinsight.appointment.service;

import com.medinsight.appointment.client.AuditClient;
import com.medinsight.appointment.dto.PrescriptionRequest;
import com.medinsight.appointment.dto.PrescriptionResponse;
import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.Prescription;
import com.medinsight.appointment.exception.AppointmentNotFoundException;
import com.medinsight.appointment.exception.UnauthorizedAccessException;
import com.medinsight.appointment.repository.AppointmentRepository;
import com.medinsight.appointment.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditClient auditClient;

    @Transactional
    public PrescriptionResponse createPrescription(UUID appointmentId, PrescriptionRequest request,
            Authentication authentication) {
        log.info("Creating prescription for appointment: {}", appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found: " + appointmentId));

        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        // Only the assigned doctor or admin can issue a prescription
        if (!hasRole(authentication, "ADMIN") && !appointment.getDoctorId().equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("Only the assigned doctor can issue prescriptions");
        }

        Prescription prescription = Prescription.builder()
                .appointmentId(appointmentId)
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .medicationName(request.getMedicationName())
                .dosage(request.getDosage())
                .duration(request.getDuration())
                .instructions(request.getInstructions())
                .build();

        prescription = prescriptionRepository.save(prescription);
        log.info("Issued prescription with ID: {}", prescription.getId());

        // Send Audit Log
        auditClient.log(
                "appointment-service",
                "ISSUE_PRESCRIPTION",
                authenticatedUserId.toString(),
                "doctor@medinsight.tn",
                "ROLE_MEDECIN",
                "SUCCESS",
                "Prescription issued for appointment " + appointmentId);

        return toResponse(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsByAppointment(UUID appointmentId, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found: " + appointmentId));

        validateAccess(appointment.getPatientId(), appointment.getDoctorId(), authentication);

        return prescriptionRepository.findByAppointmentId(appointmentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> getPatientPrescriptions(UUID patientId, Pageable pageable,
            Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        if (!hasRole(authentication, "ADMIN") && !patientId.equals(authenticatedUserId)
                && !hasRole(authentication, "MEDECIN")) {
            throw new UnauthorizedAccessException("You cannot view these prescriptions");
        }

        return prescriptionRepository.findByPatientId(patientId, pageable).map(this::toResponse);
    }

    private void validateAccess(UUID patientId, UUID doctorId, Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        boolean isPatient = patientId.equals(authenticatedUserId);
        boolean isDoctor = doctorId.equals(authenticatedUserId);

        if (!isAdmin && !isPatient && !isDoctor) {
            throw new UnauthorizedAccessException("Access denied to these prescriptions");
        }
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            try {
                return UUID.fromString(jwt.getSubject());
            } catch (IllegalArgumentException e) {
                return UUID.nameUUIDFromBytes(jwt.getSubject().getBytes());
            }
        }
        throw new UnauthorizedAccessException("Invalid authentication");
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_" + role));
    }

    private PrescriptionResponse toResponse(Prescription p) {
        return PrescriptionResponse.builder()
                .id(p.getId())
                .appointmentId(p.getAppointmentId())
                .patientId(p.getPatientId())
                .doctorId(p.getDoctorId())
                .medicationName(p.getMedicationName())
                .dosage(p.getDosage())
                .duration(p.getDuration())
                .instructions(p.getInstructions())
                .issuedAt(p.getIssuedAt())
                .build();
    }
}
