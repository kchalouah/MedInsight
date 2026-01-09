package com.medinsight.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for user response data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String keycloakId;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String addressLine;
    private String city;
    private String country;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private PatientProfileResponse patientProfile;
    private MedecinProfileResponse medecinProfile;
}
