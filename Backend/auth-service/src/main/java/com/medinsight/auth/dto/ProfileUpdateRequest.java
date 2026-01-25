package com.medinsight.auth.dto;

import com.medinsight.auth.entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for user profile updates (self-service).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    // General info
    private String phoneNumber;
    private String addressLine;
    private String city;
    private String country;

    // Patient-specific fields
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodType;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String insuranceProvider;
    private String insuranceNumber;

    // Medecin-specific fields
    private String specialization;
    private String licenseNumber;
    private Integer yearsOfExperience;
    private BigDecimal consultationFee;
}
