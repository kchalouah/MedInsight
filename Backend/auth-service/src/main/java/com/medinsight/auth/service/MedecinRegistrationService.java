package com.medinsight.auth.service;

import com.medinsight.auth.dto.MedecinRegistrationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.MedecinProfile;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.exception.UserAlreadyExistsException;
import com.medinsight.auth.repository.MedecinProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for doctor self-registration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MedecinRegistrationService {

    private final UserService userService;
    private final KeycloakService keycloakService;
    private final MedecinProfileRepository medecinProfileRepository;

    /**
     * Register a new doctor.
     * Creates user in Keycloak and PostgreSQL with MEDECIN role.
     */
    @Transactional
    public UserResponse registerMedecin(MedecinRegistrationRequest request) {
        log.info("Registering new doctor with email: {}", request.getEmail());

        // Check if license number is already in use
        if (medecinProfileRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new UserAlreadyExistsException("License number already in use: " + request.getLicenseNumber());
        }

        // Create user in Keycloak
        String keycloakId = keycloakService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName()
        );

        // Assign MEDECIN role in Keycloak
        keycloakService.assignRoleToUser(keycloakId, RoleEnum.MEDECIN);

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

        // Create doctor profile
        MedecinProfile medecinProfile = MedecinProfile.builder()
                .user(user)
                .specialization(request.getSpecialization())
                .licenseNumber(request.getLicenseNumber())
                .yearsOfExperience(request.getYearsOfExperience())
                .consultationFee(request.getConsultationFee())
                .available(true)
                .build();

        medecinProfile = medecinProfileRepository.save(medecinProfile);
        user.setMedecinProfile(medecinProfile);

        log.info("Successfully registered doctor: {}", user.getEmail());
        return userService.toUserResponse(user);
    }
}
