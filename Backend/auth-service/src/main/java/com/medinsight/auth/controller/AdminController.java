package com.medinsight.auth.controller;

import com.medinsight.auth.dto.AdminUserCreationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.service.AdminUserService;
import com.medinsight.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for admin-only user management endpoints.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin", description = "Admin-only user management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class AdminController {

    private final AdminUserService adminUserService;
    private final UserService userService;

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create any user role", description = "Admin-only endpoint to create users with any role (ADMIN, MEDECIN, PATIENT, etc.)")
    public ResponseEntity<UserResponse> createAdminUser(@Valid @RequestBody AdminUserCreationRequest request) {
        log.info("AdminController: Creating user with email: {} and role: {}", request.getEmail(), request.getRole());
        try {
            UserResponse response = adminUserService.createAdminUser(request);
            log.info("AdminController: Successfully created user: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("AdminController: Error creating user: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/users/{keycloakId}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign role to user", description = "Admin-only endpoint to assign roles to existing users")
    public ResponseEntity<Map<String, String>> assignRole(
            @PathVariable String keycloakId,
            @RequestBody Map<String, String> roleRequest) {
        log.info("Admin assigning role to user: {}", keycloakId);
        RoleEnum role = RoleEnum.valueOf(roleRequest.get("role"));
        adminUserService.assignRoleToUser(keycloakId, role);
        return ResponseEntity.ok(Map.of("message", "Role assigned successfully"));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "List all users", description = "Admin-only endpoint to list all users with pagination")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        log.info("Admin fetching all users, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<User> users = userService.findAll(pageable);
        Page<UserResponse> response = users.map(userService::toUserResponse);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync-keycloak")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sync users from Keycloak", description = "Admin-only endpoint to synchronize users from Keycloak to the local database")
    public ResponseEntity<Map<String, String>> syncKeycloak() {
        log.info("AdminController: Triggering Keycloak synchronization");
        try {
            adminUserService.syncWithKeycloak();
            log.info("AdminController: Synchronization successful");
            return ResponseEntity.ok(Map.of("message", "Synchronization successful"));
        } catch (Exception e) {
            log.error("AdminController: Error during synchronization: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/users/keycloak/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE')")
    @Operation(summary = "Get user by Keycloak ID", description = "Retrieve any user profile by their Keycloak ID.")
    public ResponseEntity<UserResponse> getUserByKeycloakId(@PathVariable String keycloakId) {
        log.info("Admin fetching user by Keycloak ID: {}", keycloakId);
        User user = userService.findByKeycloakId(keycloakId);
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    @DeleteMapping("/users/{keycloakId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Admin-only endpoint to delete a user from both Keycloak and the database")
    public ResponseEntity<Void> deleteUser(@PathVariable String keycloakId) {
        log.info("Admin deleting user: {}", keycloakId);
        adminUserService.deleteUser(keycloakId);
        return ResponseEntity.noContent().build();
    }
}
