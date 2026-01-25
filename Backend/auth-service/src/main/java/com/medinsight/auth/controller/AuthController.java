package com.medinsight.auth.controller;

import com.medinsight.auth.dto.*;
import com.medinsight.auth.service.MedecinRegistrationService;
import com.medinsight.auth.service.PatientRegistrationService;
import com.medinsight.auth.service.UserService;
import com.medinsight.auth.service.KeycloakService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for public authentication and registration endpoints.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Public authentication and registration endpoints")
public class AuthController {

    private final PatientRegistrationService patientRegistrationService;
    private final MedecinRegistrationService medecinRegistrationService;
    private final UserService userService;
    private final KeycloakService keycloakService;

    @PostMapping("/register/patient")
    @Operation(summary = "Register a new patient", description = "Public endpoint for patient self-registration")
    public ResponseEntity<UserResponse> registerPatient(@Valid @RequestBody PatientRegistrationRequest request) {
        log.info("Received patient registration request for email: {}", request.getEmail());
        UserResponse response = patientRegistrationService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/medecin")
    @Operation(summary = "Register a new doctor", description = "Public endpoint for doctor self-registration")
    public ResponseEntity<UserResponse> registerMedecin(@Valid @RequestBody MedecinRegistrationRequest request) {
        log.info("Received doctor registration request for email: {}", request.getEmail());
        UserResponse response = medecinRegistrationService.registerMedecin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update own profile", description = "Authenticated users can update their own profile information")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        String keycloakId = authentication.getName();
        log.info("User {} updating profile", keycloakId);
        UserResponse response = userService.updateProfile(keycloakId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/password/change")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password", description = "Authenticated users can change their password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String keycloakId = authentication.getName();
        log.info("User {} changing password", keycloakId);
        keycloakService.changeUserPassword(keycloakId, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get own profile", description = "Get currently authenticated user's profile")
    public ResponseEntity<UserResponse> getOwnProfile(Authentication authentication) {
        String keycloakId = authentication.getName();
        log.info("User {} fetching own profile", keycloakId);
        UserResponse response = userService.getUserByKeycloakId(keycloakId);
        return ResponseEntity.ok(response);
    }
}
