package com.medinsight.record.service;

import com.medinsight.record.client.AppointmentClient;
import com.medinsight.record.client.AuditClient;
import com.medinsight.record.client.MailClient;
import com.medinsight.record.dto.*;
import com.medinsight.record.entity.ConsultationNote;
import com.medinsight.record.entity.PatientMedicalRecord;
import com.medinsight.record.exception.ResourceNotFoundException;
import com.medinsight.record.repository.ConsultationNoteRepository;
import com.medinsight.record.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class RecordService {

    private final MedicalRecordRepository recordRepository;
    private final ConsultationNoteRepository noteRepository;
    private final AppointmentClient appointmentClient;
    private final AuditClient auditClient;
    private final MailClient mailClient;

    @Transactional(readOnly = true)
    public MedicalDossierResponse getDetailedDossier(UUID patientId, Authentication authentication) {
        log.info("Fetching detailed dossier for patient: {}", patientId);

        // 1. Get Local Clinical Data
        PatientMedicalRecord record = recordRepository.findByPatientId(patientId)
                .orElseGet(() -> createEmptyRecord(patientId));

        List<ConsultationNote> notes = noteRepository.findByPatientId(patientId);

        // 2. Fetch Remote Data via Feign
        List<ExternalAppointmentResponse> appointments = List.of();
        List<ExternalPrescriptionResponse> prescriptions = List.of();

        try {
            appointments = appointmentClient.getPatientAppointments(patientId);
            prescriptions = appointmentClient.getPatientPrescriptions(patientId);
        } catch (Exception e) {
            log.error("Failed to fetch data from appointment-service for patient: {}", patientId, e);
        }

        // 3. Aggregate
        return MedicalDossierResponse.builder()
                .patientId(patientId)
                .medicalRecord(toRecordResponse(record))
                .consultationNotes(notes.stream().map(this::toNoteResponse).collect(Collectors.toList()))
                .appointmentHistory(appointments)
                .prescriptionHistory(prescriptions)
                .build();
    }

    @Transactional
    public PatientMedicalRecordResponse updateMedicalRecord(UUID patientId, MedicalRecordRequest request) {
        PatientMedicalRecord record = recordRepository.findByPatientId(patientId)
                .orElseGet(() -> PatientMedicalRecord.builder().patientId(patientId).build());

        record.setBloodType(request.getBloodType());
        record.setAllergies(request.getAllergies());
        record.setChronicConditions(request.getChronicConditions());
        record.setEmergencyContactName(request.getEmergencyContactName());
        record.setEmergencyContactPhone(request.getEmergencyContactPhone());
        record.setMedicalHistory(request.getMedicalHistory());

        PatientMedicalRecord saved = recordRepository.save(record);

        auditClient.log(
                "medical-record-service",
                "UPDATE_RECORD",
                patientId.toString(),
                "patient-profile@medinsight.tn", // Placeholder/lookup needed for real, but using placeholder for now
                "ROLE_PATIENT",
                "SUCCESS",
                "Medical record updated for patient");

        // Send Notification Email
        mailClient.sendMail(
                "patient-profile@medinsight.tn",
                "Mise à jour de votre dossier médical",
                "Bonjour,\n\nDes informations ont été mises à jour dans votre dossier médical sur MedInsight.\n\nCordialement,\nL'équipe MedInsight",
                false);

        return toRecordResponse(saved);
    }

    @Transactional
    public ConsultationNoteResponse addConsultationNote(ConsultationNoteRequest request, UUID doctorId) {
        ConsultationNote note = ConsultationNote.builder()
                .appointmentId(request.getAppointmentId())
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .noteContent(request.getNoteContent())
                .build();

        ConsultationNote savedNote = noteRepository.save(note);

        auditClient.log(
                "medical-record-service",
                "ADD_NOTE",
                doctorId.toString(),
                "doctor@medinsight.tn",
                "ROLE_MEDECIN",
                "SUCCESS",
                "Consultation note added for patient " + request.getPatientId());

        return toNoteResponse(savedNote);
    }

    private PatientMedicalRecord createEmptyRecord(UUID patientId) {
        return PatientMedicalRecord.builder()
                .patientId(patientId)
                .build();
    }

    private PatientMedicalRecordResponse toRecordResponse(PatientMedicalRecord r) {
        return PatientMedicalRecordResponse.builder()
                .id(r.getId())
                .patientId(r.getPatientId())
                .bloodType(r.getBloodType())
                .allergies(r.getAllergies())
                .chronicConditions(r.getChronicConditions())
                .emergencyContactName(r.getEmergencyContactName())
                .emergencyContactPhone(r.getEmergencyContactPhone())
                .medicalHistory(r.getMedicalHistory())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    /**
     * Delete a consultation note.
     */
    @Transactional
    public void deleteConsultationNote(UUID noteId, UUID doctorId, boolean isAdmin) {
        ConsultationNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation note not found with ID: " + noteId));

        // Only the author (doctor) or an admin can delete
        if (!isAdmin && !note.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Access Denied: You can only delete your own notes");
        }

        noteRepository.delete(note);
        log.info("Deleted consultation note: {}", noteId);
    }

    private ConsultationNoteResponse toNoteResponse(ConsultationNote n) {
        return ConsultationNoteResponse.builder()
                .id(n.getId())
                .appointmentId(n.getAppointmentId())
                .patientId(n.getPatientId())
                .doctorId(n.getDoctorId())
                .noteContent(n.getNoteContent())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
