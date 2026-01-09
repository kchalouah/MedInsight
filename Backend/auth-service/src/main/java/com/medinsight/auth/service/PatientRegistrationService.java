package com.medinsight.auth.service;

import com.medinsight.auth.dto.PatientRegistrationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.PatientProfile;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.exception.UserAlreadyExistsException;
import com.medinsight.auth.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for patient self-registration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatientRegistrationService {

    private final UserService userService;
    private final KeycloakService keycloakService;
    private final PatientProfileRepository patientProfileRepository;

    /**
     * Register a new patient.
     * Creates user in Keycloak and PostgreSQL with PATIENT role.
     */
    @Transactional
    public UserResponse registerPatient(PatientRegistrationRequest request) {
        log.info("Registering new patient with email: {}", request.getEmail());

        // Create user in Keycloak
        String keycloakId = keycloakService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName()
        );

        // Assign PATIENT role in Keycloak
        keycloakService.assignRoleToUser(keycloakId, RoleEnum.PATIENT);

        // Create user in database
        User user = User.builder()
                .keycloakId(keycloakId)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .country(request.getCountry())
                .enabled(true)
                .build();

        user = userService.createUser(user);

        // Create patient profile
        PatientProfile patientProfile = PatientProfile.builder()
                .user(user)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .bloodType(request.getBloodType())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .insuranceProvider(request.getInsuranceProvider())
                .insuranceNumber(request.getInsuranceNumber())
                .build();

        patientProfile = patientProfileRepository.save(patientProfile);
        user.setPatientProfile(patientProfile);

        log.info("Successfully registered patient: {}", user.getEmail());
        return userService.toUserResponse(user);
    }
}
