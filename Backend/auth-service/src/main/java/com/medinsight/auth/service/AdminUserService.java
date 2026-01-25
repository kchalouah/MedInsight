package com.medinsight.auth.service;

import com.medinsight.auth.client.AuditClient;
import com.medinsight.auth.client.MailClient;
import com.medinsight.auth.dto.AdminUserCreationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.MedecinProfile;
import com.medinsight.auth.entity.PatientProfile;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Service for admin-only user creation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserService userService;
    private final KeycloakService keycloakService;
    private final AuditClient auditClient;
    private final MailClient mailClient;

    /**
     * Create a new user with any role.
     * Only accessible by ADMIN users.
     */
    @Transactional
    public UserResponse createAdminUser(AdminUserCreationRequest request) {
        log.info("AdminUserService: Starting user creation for email: {} with role: {}", request.getEmail(),
                request.getRole());

        try {
            // Create user in Keycloak
            String keycloakId = keycloakService.createUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getFirstName(),
                    request.getLastName());

            // Assign role in Keycloak
            keycloakService.assignRoleToUser(keycloakId, request.getRole());

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

            // Handle profile creation based on role
            if (request.getRole() == RoleEnum.PATIENT) {
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
                user.setPatientProfile(patientProfile);
            } else if (request.getRole() == RoleEnum.MEDECIN) {
                MedecinProfile medecinProfile = MedecinProfile.builder()
                        .user(user)
                        .specialization(request.getSpecialization())
                        .licenseNumber(request.getLicenseNumber())
                        .yearsOfExperience(request.getYearsOfExperience())
                        .consultationFee(request.getConsultationFee())
                        .available(true)
                        .build();
                user.setMedecinProfile(medecinProfile);
            }

            user = userService.createUser(user);

            log.info("Successfully created user: {} with role: {}", user.getEmail(), request.getRole());

            // Audit Log
            auditClient.log(
                    "auth-service",
                    "ADMIN_CREATE_USER",
                    request.getEmail(),
                    request.getEmail(),
                    request.getRole().name(),
                    "SUCCESS",
                    "Admin created user with role: " + request.getRole());

            return userService.toUserResponse(user);
        } catch (Exception e) {
            log.error("AdminUserService: Error creating user {}: {}", request.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Assign additional roles to a user.
     */
    @Transactional
    public void assignRoleToUser(String userId, RoleEnum role) {
        User user = userService.findByKeycloakId(userId);
        keycloakService.assignRoleToUser(user.getKeycloakId(), role);
        log.info("Assigned role {} to user {}", role, user.getEmail());
    }

    /**
     * Synchronize users from Keycloak to the local database.
     */
    @Transactional
    public void syncWithKeycloak() {
        log.info("Starting synchronization with Keycloak...");
        List<Map<String, Object>> keycloakUsers = keycloakService.getAllUsers();
        int syncedCount = 0;

        for (Map<String, Object> kUser : keycloakUsers) {
            String keycloakId = (String) kUser.get("id");
            String email = (String) kUser.get("email");

            if (email == null)
                continue;

            if (!userService.existsByKeycloakId(keycloakId)) {
                log.info("Syncing new user from Keycloak: {}", email);
                User user = User.builder()
                        .keycloakId(keycloakId)
                        .email(email)
                        .firstName((String) kUser.get("firstName"))
                        .lastName((String) kUser.get("lastName"))
                        .enabled((Boolean) kUser.get("enabled"))
                        .build();

                userService.createUser(user);
                syncedCount++;
            }
        }
        log.info("Synchronization complete. Synced {} new users.", syncedCount);
    }

    /**
     * Delete user by Keycloak ID (from both Keycloak and DB).
     */
    @Transactional
    public void deleteUser(String keycloakId) {
        // 1. Delete from Keycloak
        try {
            keycloakService.deleteUser(keycloakId);
        } catch (Exception e) {
            log.warn("Failed to delete user {} from Keycloak (might already be deleted): {}", keycloakId,
                    e.getMessage());
        }

        // 2. Delete from Database
        try {
            userService.deleteUserByKeycloakId(keycloakId);
            log.info("Successfully deleted user {} from system", keycloakId);

            // Audit Log
            auditClient.log(
                    "auth-service",
                    "ADMIN_DELETE_USER",
                    keycloakId,
                    "deleted-user@medinsight.tn",
                    "UNKNOWN",
                    "SUCCESS",
                    "Admin deleted user from Keycloak and local DB");
        } catch (Exception e) {
            log.warn("User {} deleted from Keycloak but not found in local DB (or deletion failed): {}", keycloakId,
                    e.getMessage());
        }
    }
}
