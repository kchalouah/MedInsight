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
    @Operation(summary = "Create GESTIONNAIRE or RESPONSABLE_SECURITE user",
               description = "Admin-only endpoint to create users with GESTIONNAIRE or RESPONSABLE_SECURITE roles")
    public ResponseEntity<UserResponse> createAdminUser(@Valid @RequestBody AdminUserCreationRequest request) {
        log.info("Admin creating user with email: {} and role: {}", request.getEmail(), request.getRole());
        UserResponse response = adminUserService.createAdminUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
    @DeleteMapping("/users/{keycloakId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Admin-only endpoint to delete a user from both Keycloak and the database")
    public ResponseEntity<Void> deleteUser(@PathVariable String keycloakId) {
        log.info("Admin deleting user: {}", keycloakId);
        adminUserService.deleteUser(keycloakId);
        return ResponseEntity.noContent().build();
    }


}
