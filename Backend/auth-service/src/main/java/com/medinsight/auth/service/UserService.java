package com.medinsight.auth.service;

import com.medinsight.auth.dto.*;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.exception.UserAlreadyExistsException;
import com.medinsight.auth.exception.UserNotFoundException;
import com.medinsight.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for user management operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final KeycloakService keycloakService;

    /**
     * Find user by ID.
     */
    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));
    }

    /**
     * Find user by email.
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    /**
     * Find user by Keycloak ID.
     */
    @Transactional(readOnly = true)
    public User findByKeycloakId(String keycloakId) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found with Keycloak ID: " + keycloakId));
    }

    /**
     * Check if user exists by Keycloak ID.
     */
    @Transactional(readOnly = true)
    public boolean existsByKeycloakId(String keycloakId) {
        return userRepository.existsByKeycloakId(keycloakId);
    }

    /**
     * Get all users with pagination.
     */
    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * Get all doctors with pagination.
     */
    public Page<User> findDoctors(Pageable pageable) {
        return userRepository.findAllByMedecinProfileIsNotNull(pageable);
    }

    /**
     * Get all patients with pagination.
     */
    @Transactional(readOnly = true)
    public Page<User> findPatients(Pageable pageable) {
        return userRepository.findAllByPatientProfileIsNotNull(pageable);
    }

    /**
     * Create a new user.
     */
    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new UserAlreadyExistsException("User already exists with email: " + user.getEmail());
        }
        if (user.getKeycloakId() != null && userRepository.existsByKeycloakId(user.getKeycloakId())) {
            throw new UserAlreadyExistsException("User already exists with Keycloak ID: " + user.getKeycloakId());
        }
        return userRepository.save(user);
    }

    /**
     * Update user.
     */
    @Transactional
    public User updateUser(User user) {
        if (!userRepository.existsById(user.getId())) {
            throw new UserNotFoundException("User not found with ID: " + user.getId());
        }
        return userRepository.save(user);
    }

    /**
     * Convert User entity to UserResponse DTO.
     */
    public UserResponse toUserResponse(User user) {
        // Fetch role from Keycloak
        String role = keycloakService.getUserPrimaryRole(user.getKeycloakId());

        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(UUID.fromString(user.getKeycloakId()))
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .addressLine(user.getAddressLine())
                .city(user.getCity())
                .country(user.getCountry())
                .enabled(user.getEnabled())
                .role(role) // Add role from Keycloak
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        if (user.getPatientProfile() != null) {
            builder.patientProfile(toPatientProfileResponse(user.getPatientProfile()));
        }

        if (user.getMedecinProfile() != null) {
            builder.medecinProfile(toMedecinProfileResponse(user.getMedecinProfile()));
        }

        return builder.build();
    }

    /**
     * Update user profile (self-service).
     */
    @Transactional
    public UserResponse updateProfile(String keycloakId, ProfileUpdateRequest request) {
        User user = findByKeycloakId(keycloakId);

        // Update general fields
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAddressLine() != null) {
            user.setAddressLine(request.getAddressLine());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }

        // Update patient profile if exists
        if (user.getPatientProfile() != null) {
            var profile = user.getPatientProfile();
            if (request.getDateOfBirth() != null)
                profile.setDateOfBirth(request.getDateOfBirth());
            if (request.getGender() != null)
                profile.setGender(request.getGender());
            if (request.getBloodType() != null)
                profile.setBloodType(request.getBloodType());
            if (request.getEmergencyContactName() != null)
                profile.setEmergencyContactName(request.getEmergencyContactName());
            if (request.getEmergencyContactPhone() != null)
                profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
            if (request.getInsuranceProvider() != null)
                profile.setInsuranceProvider(request.getInsuranceProvider());
            if (request.getInsuranceNumber() != null)
                profile.setInsuranceNumber(request.getInsuranceNumber());
        }

        // Update medecin profile if exists
        if (user.getMedecinProfile() != null) {
            var profile = user.getMedecinProfile();
            if (request.getSpecialization() != null)
                profile.setSpecialization(request.getSpecialization());
            if (request.getLicenseNumber() != null)
                profile.setLicenseNumber(request.getLicenseNumber());
            if (request.getYearsOfExperience() != null)
                profile.setYearsOfExperience(request.getYearsOfExperience());
            if (request.getConsultationFee() != null)
                profile.setConsultationFee(request.getConsultationFee());
        }

        user = userRepository.save(user);
        log.info("Updated profile for user: {}", user.getEmail());
        return toUserResponse(user);
    }

    /**
     * Get user by Keycloak ID and convert to response.
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByKeycloakId(String keycloakId) {
        User user = findByKeycloakId(keycloakId);
        return toUserResponse(user);
    }

    private PatientProfileResponse toPatientProfileResponse(com.medinsight.auth.entity.PatientProfile profile) {
        return PatientProfileResponse.builder()
                .id(profile.getId())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .bloodType(profile.getBloodType())
                .emergencyContactName(profile.getEmergencyContactName())
                .emergencyContactPhone(profile.getEmergencyContactPhone())
                .insuranceProvider(profile.getInsuranceProvider())
                .insuranceNumber(profile.getInsuranceNumber())
                .build();
    }

    private MedecinProfileResponse toMedecinProfileResponse(com.medinsight.auth.entity.MedecinProfile profile) {
        return MedecinProfileResponse.builder()
                .id(profile.getId())
                .specialization(profile.getSpecialization())
                .licenseNumber(profile.getLicenseNumber())
                .yearsOfExperience(profile.getYearsOfExperience())
                .consultationFee(profile.getConsultationFee())
                .available(profile.getAvailable())
                .build();
    }

    /**
     * Delete user by ID.
     */
    @Transactional
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
    }

    /**
     * Delete user by Keycloak ID.
     */
    @Transactional
    public void deleteUserByKeycloakId(String keycloakId) {
        if (!userRepository.existsByKeycloakId(keycloakId)) {
            throw new UserNotFoundException("User not found with Keycloak ID: " + keycloakId);
        }
        userRepository.deleteByKeycloakId(keycloakId);
    }
}
