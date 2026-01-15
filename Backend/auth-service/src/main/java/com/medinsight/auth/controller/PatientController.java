package com.medinsight.auth.controller;

import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@Tag(name = "Patient", description = "Patient management endpoints")
public class PatientController {

    private final UserService userService;

    @Operation(summary = "List all patients", description = "Retrieve a paginated list of all patients. Requires MEDECIN, GESTIONNAIRE or ADMIN role.")
    @GetMapping
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<Page<UserResponse>> getAllPatients(Pageable pageable) {
        Page<User> users = userService.findPatients(pageable);
        Page<UserResponse> responses = users.map(userService::toUserResponse);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get patient by ID", description = "Retrieve a single patient's profile by their Keycloak ID.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<UserResponse> getPatientById(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        // Warning: UserService.findById expects UUID, make sure the ID passed is local DB ID or solve Keycloak ID mapping
        // The frontend usually passes Keycloak ID (string). 
        // UserService has findByKeycloakId.
        // Let's assume the path variable is the string keycloakId or check usage.
        // In api.ts UserResponse.id is UUID string.
        
        // Actually UserService.findById(UUID) exists.
        User user = userService.findById(id);
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    @Operation(summary = "Get patient by Keycloak ID", description = "Retrieve a patient by Keycloak ID string")
    @GetMapping("/keycloak/{keycloakId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<UserResponse> getPatientByKeycloakId(@org.springframework.web.bind.annotation.PathVariable String keycloakId) {
       User user = userService.findByKeycloakId(keycloakId);
       return ResponseEntity.ok(userService.toUserResponse(user));
    }
}
