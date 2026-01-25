package com.medinsight.appointment.service;

import com.medinsight.appointment.client.AuditClient;
import com.medinsight.appointment.client.MailClient;
import com.medinsight.appointment.dto.*;
import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.AppointmentStatus;
import com.medinsight.appointment.exception.AppointmentConflictException;
import com.medinsight.appointment.exception.AppointmentNotFoundException;
import com.medinsight.appointment.exception.UnauthorizedAccessException;
import com.medinsight.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for appointment management operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder;
    private final AuditClient auditClient;
    private final MailClient mailClient;

    /**
     * Create a new appointment.
     */
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request, Authentication authentication) {
        log.info("Creating appointment for patient {} with doctor {}", request.getPatientId(), request.getDoctorId());

        // Validate patient can only create appointments for themselves
        UUID authenticatedUserId = getUserIdFromAuth(authentication);
        if (!hasRole(authentication, "ADMIN") && !request.getPatientId().equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("Patients can only create appointments for themselves");
        }

        // Check for doctor availability (simple conflict check)
        LocalDateTime appointmentTime = request.getAppointmentDateTime();
        LocalDateTime startWindow = appointmentTime.minusMinutes(30);
        LocalDateTime endWindow = appointmentTime.plusMinutes(30);

        List<Appointment> conflicts = appointmentRepository
                .findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                        request.getDoctorId(),
                        startWindow,
                        endWindow,
                        AppointmentStatus.CANCELLED);

        if (!conflicts.isEmpty()) {
            throw new AppointmentConflictException("Doctor is not available at the requested time");
        }

        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentDateTime(request.getAppointmentDateTime())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(AppointmentStatus.SCHEDULED)
                .build();

        appointment = appointmentRepository.save(appointment);
        log.info("Created appointment with ID: {}", appointment.getId());

        // Fetch names and emails for the notification
        String patientName = fetchUserName(request.getPatientId());
        String doctorName = fetchUserName(request.getDoctorId());
        String patientEmail = fetchUserEmail(request.getPatientId());

        // Audit Log
        auditClient.log(
                "appointment-service",
                "CREATE_APPOINTMENT",
                authenticatedUserId.toString(),
                "app-user@medinsight.tn",
                "UNKNOWN",
                "SUCCESS",
                "Appointment created for patient " + request.getPatientId());

        // Send Email Confirmation
        if (patientEmail != null) {
            mailClient.sendAppointmentEmail(MailClient.AppointmentReminderRequest.builder()
                    .to(patientEmail)
                    .patientName(patientName != null ? patientName : "Patient")
                    .appointmentDate(request.getAppointmentDateTime().toLocalDate().toString())
                    .appointmentTime(request.getAppointmentDateTime().toLocalTime().toString())
                    .doctorName(doctorName != null ? doctorName : "Docteur")
                    .location("Clinique MedInsight, Tunis")
                    .build());
        }

        return toResponse(appointment);
    }

    /**
     * Get appointment by ID.
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointment(UUID id, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found with ID: " + id));

        // Check access permissions
        validateAccess(appointment, authentication);

        return toResponse(appointment);
    }

    /**
     * Update appointment.
     */
    @Transactional
    public AppointmentResponse updateAppointment(UUID id, AppointmentUpdateRequest request,
            Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found with ID: " + id));

        // Check access permissions
        UUID authenticatedUserId = getUserIdFromAuth(authentication);
        validateUpdateAccess(appointment, authentication);

        if (request.getAppointmentDateTime() != null) {
            appointment.setAppointmentDateTime(request.getAppointmentDateTime());
        }
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }
        if (request.getReason() != null) {
            appointment.setReason(request.getReason());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }

        appointment = appointmentRepository.save(appointment);
        log.info("Updated appointment with ID: {}", id);

        // Audit Log
        auditClient.log(
                "appointment-service",
                "UPDATE_APPOINTMENT",
                authenticatedUserId.toString(),
                "app-user@medinsight.tn",
                "UNKNOWN",
                "SUCCESS",
                "Appointment " + id + " updated to status: " + request.getStatus());

        return toResponse(appointment);
    }

    /**
     * Delete appointment.
     */
    @Transactional
    public void deleteAppointment(UUID id, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found with ID: " + id));

        // Only admin or the patient can delete
        UUID authenticatedUserId = getUserIdFromAuth(authentication);
        if (!hasRole(authentication, "ADMIN") && !appointment.getPatientId().equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("You do not have permission to delete this appointment");
        }

        appointmentRepository.delete(appointment);
        log.info("Deleted appointment with ID: {}", id);

        // Audit Log
        auditClient.log(
                "appointment-service",
                "DELETE_APPOINTMENT",
                authenticatedUserId.toString(),
                "app-user@medinsight.tn",
                "UNKNOWN",
                "SUCCESS",
                "Appointment " + id + " deleted");
    }

    /**
     * Get all appointments with filtering.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointments(AppointmentFilterRequest filter, Pageable pageable,
            Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        boolean isDoctor = hasRole(authentication, "MEDECIN");

        Page<Appointment> appointments;

        if (isAdmin) {
            // Admin can see all appointments with filters
            appointments = applyFilters(filter, pageable);
        } else if (isDoctor) {
            // Doctor can only see their own appointments
            filter.setDoctorId(authenticatedUserId);
            appointments = applyFilters(filter, pageable);
        } else {
            // Patient can only see their own appointments
            filter.setPatientId(authenticatedUserId);
            appointments = applyFilters(filter, pageable);
        }

        return appointments.map(this::toResponse);
    }

    /**
     * Get appointments for a specific patient.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getPatientAppointments(UUID patientId, Pageable pageable,
            Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        if (!hasRole(authentication, "ADMIN") && !patientId.equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("You can only view your own appointments");
        }

        Page<Appointment> appointments = appointmentRepository.findByPatientId(patientId, pageable);
        return appointments.map(this::toResponse);
    }

    /**
     * Get appointments for a specific doctor.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getDoctorAppointments(UUID doctorId, Pageable pageable,
            Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        if (!hasRole(authentication, "ADMIN") && !hasRole(authentication, "MEDECIN")) {
            throw new UnauthorizedAccessException("Only doctors and admins can view doctor appointments");
        }

        if (!hasRole(authentication, "ADMIN") && !doctorId.equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("You can only view your own appointments");
        }

        Page<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId, pageable);
        return appointments.map(this::toResponse);
    }

    // Helper methods

    private Page<Appointment> applyFilters(AppointmentFilterRequest filter, Pageable pageable) {
        if (filter.getPatientId() != null && filter.getStatus() != null) {
            return appointmentRepository.findByPatientIdAndStatus(filter.getPatientId(), filter.getStatus(), pageable);
        } else if (filter.getDoctorId() != null && filter.getStatus() != null) {
            return appointmentRepository.findByDoctorIdAndStatus(filter.getDoctorId(), filter.getStatus(), pageable);
        } else if (filter.getPatientId() != null && filter.getStartDate() != null && filter.getEndDate() != null) {
            return appointmentRepository.findByPatientIdAndDateRange(filter.getPatientId(), filter.getStartDate(),
                    filter.getEndDate(), pageable);
        } else if (filter.getDoctorId() != null && filter.getStartDate() != null && filter.getEndDate() != null) {
            return appointmentRepository.findByDoctorIdAndDateRange(filter.getDoctorId(), filter.getStartDate(),
                    filter.getEndDate(), pageable);
        } else if (filter.getPatientId() != null) {
            return appointmentRepository.findByPatientId(filter.getPatientId(), pageable);
        } else if (filter.getDoctorId() != null) {
            return appointmentRepository.findByDoctorId(filter.getDoctorId(), pageable);
        } else if (filter.getStatus() != null) {
            return appointmentRepository.findByStatus(filter.getStatus(), pageable);
        } else if (filter.getStartDate() != null && filter.getEndDate() != null) {
            return appointmentRepository.findByDateRange(filter.getStartDate(), filter.getEndDate(), pageable);
        } else {
            return appointmentRepository.findAll(pageable);
        }
    }

    private void validateAccess(Appointment appointment, Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        if (hasRole(authentication, "ADMIN")) {
            return; // Admin can access all
        }

        if (appointment.getPatientId().equals(authenticatedUserId)) {
            return; // Patient can access their own
        }

        if (hasRole(authentication, "MEDECIN") && appointment.getDoctorId().equals(authenticatedUserId)) {
            return; // Doctor can access their own
        }

        throw new UnauthorizedAccessException("You do not have permission to access this appointment");
    }

    private void validateUpdateAccess(Appointment appointment, Authentication authentication) {
        UUID authenticatedUserId = getUserIdFromAuth(authentication);

        if (hasRole(authentication, "ADMIN")) {
            return; // Admin can update all
        }

        if (hasRole(authentication, "MEDECIN") && appointment.getDoctorId().equals(authenticatedUserId)) {
            return; // Doctor can update their appointments
        }

        if (appointment.getPatientId().equals(authenticatedUserId)) {
            return; // Patient can update their own
        }

        throw new UnauthorizedAccessException("You do not have permission to update this appointment");
    }

    private UUID getUserIdFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            // In a real implementation, you would look up the user ID from the auth-service
            // For now, we'll use the subject as the user ID
            try {
                return UUID.fromString(sub);
            } catch (IllegalArgumentException e) {
                // If subject is not a UUID, use a hash or lookup
                log.warn("Subject is not a UUID, using placeholder");
                return UUID.nameUUIDFromBytes(sub.getBytes());
            }
        }
        throw new UnauthorizedAccessException("Invalid authentication");
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_" + role));
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        // Fetch patient and doctor names from auth-service
        String patientName = fetchUserName(appointment.getPatientId());
        String doctorName = fetchUserName(appointment.getDoctorId());

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .patientName(patientName)
                .doctorName(doctorName)
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    private String fetchUserName(UUID keycloakId) {
        Map<String, Object> userData = fetchUserData(keycloakId);
        if (userData != null && userData.get("firstName") != null && userData.get("lastName") != null) {
            return userData.get("firstName") + " " + userData.get("lastName");
        }
        return null;
    }

    private String fetchUserEmail(UUID keycloakId) {
        Map<String, Object> userData = fetchUserData(keycloakId);
        if (userData != null && userData.get("email") != null) {
            return (String) userData.get("email");
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserData(UUID keycloakId) {
        try {
            org.springframework.web.reactive.function.client.WebClient webClient = webClientBuilder.build();
            return webClient.get()
                    .uri("http://auth-service:8081/api/internal/users/keycloak/" + keycloakId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.warn("Failed to fetch user data for ID {}: {}", keycloakId, e.getMessage());
        }
        return null;
    }
}
