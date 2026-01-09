package com.medinsight.auth.controller;

import com.medinsight.auth.dto.MedecinRegistrationRequest;
import com.medinsight.auth.dto.PatientRegistrationRequest;
import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.service.MedecinRegistrationService;
import com.medinsight.auth.service.PatientRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for public authentication and registration endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Public authentication and registration endpoints")
public class AuthController {

    private final PatientRegistrationService patientRegistrationService;
    private final MedecinRegistrationService medecinRegistrationService;

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
}
