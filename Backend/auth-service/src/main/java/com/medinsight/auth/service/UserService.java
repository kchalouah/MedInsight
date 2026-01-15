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
