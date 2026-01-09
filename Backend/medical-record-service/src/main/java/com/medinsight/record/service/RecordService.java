package com.medinsight.record.service;

import com.medinsight.record.client.AppointmentClient;
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

        return toRecordResponse(recordRepository.save(record));
    }

    @Transactional
    public ConsultationNoteResponse addConsultationNote(ConsultationNoteRequest request, UUID doctorId) {
        ConsultationNote note = ConsultationNote.builder()
                .appointmentId(request.getAppointmentId())
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .noteContent(request.getNoteContent())
                .build();

        return toNoteResponse(noteRepository.save(note));
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
