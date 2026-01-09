package com.medinsight.record.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientMedicalRecordResponse {
    private UUID id;
    private UUID patientId;
    private String bloodType;
    private String allergies;
    private String chronicConditions;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String medicalHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
