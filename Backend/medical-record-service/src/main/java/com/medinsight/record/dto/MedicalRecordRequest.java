package com.medinsight.record.dto;

import lombok.Data;

@Data
public class MedicalRecordRequest {
    private String bloodType;
    private String allergies;
    private String chronicConditions;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String medicalHistory;
}
