package com.medinsight.auth.dto;

import com.medinsight.auth.entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for patient profile response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientProfileResponse {

    private UUID id;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodType;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String insuranceProvider;
    private String insuranceNumber;
}
