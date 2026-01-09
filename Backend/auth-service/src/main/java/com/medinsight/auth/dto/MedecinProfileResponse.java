package com.medinsight.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for doctor profile response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedecinProfileResponse {

    private UUID id;
    private String specialization;
    private String licenseNumber;
    private Integer yearsOfExperience;
    private BigDecimal consultationFee;
    private Boolean available;
}
