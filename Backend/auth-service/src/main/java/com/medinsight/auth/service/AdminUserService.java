package com.medinsight.auth.service;

import com.medinsight.auth.dto.AdminUserCreationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for admin-only user creation (GESTIONNAIRE, RESPONSABLE_SECURITE).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserService userService;
    private final KeycloakService keycloakService;

    /**
     * Create a new user with GESTIONNAIRE or RESPONSABLE_SECURITE role.
     * Only accessible by ADMIN users.
     */
    @Transactional
    public UserResponse createAdminUser(AdminUserCreationRequest request) {
        log.info("Admin creating new user with email: {} and role: {}", request.getEmail(), request.getRole());

        // Validate that role is either GESTIONNAIRE or RESPONSABLE_SECURITE
        if (request.getRole() != RoleEnum.GESTIONNAIRE && 
            request.getRole() != RoleEnum.RESPONSABLE_SECURITE) {
            throw new IllegalArgumentException(
                "Only GESTIONNAIRE and RESPONSABLE_SECURITE roles can be created via this endpoint. " +
                "Use registration endpoints for PATIENT and MEDECIN roles."
            );
        }

        // Create user in Keycloak
        String keycloakId = keycloakService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName()
        );

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

        user = userService.createUser(user);

        log.info("Successfully created admin user: {} with role: {}", user.getEmail(), request.getRole());
        return userService.toUserResponse(user);
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
     * Delete user by Keycloak ID (from both Keycloak and DB).
     */
    @Transactional
    public void deleteUser(String keycloakId) {
        // 1. Delete from Keycloak
        try {
            keycloakService.deleteUser(keycloakId);
        } catch (Exception e) {
            log.warn("Failed to delete user {} from Keycloak (might already be deleted): {}", keycloakId, e.getMessage());
        }

        // 2. Delete from Database
        try {
            userService.deleteUserByKeycloakId(keycloakId);
            log.info("Successfully deleted user {} from system", keycloakId);
        } catch (Exception e) {
            log.warn("User {} deleted from Keycloak but not found in local DB (or deletion failed): {}", keycloakId, e.getMessage());
        }
    }
}
