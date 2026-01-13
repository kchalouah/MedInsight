package com.medinsight.auth.controller;

import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for doctor-related endpoints accessible by other roles.
 */
@RestController
@RequestMapping("/medecins")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Medecin Information", description = "Endpoints for retrieving doctor information")
@SecurityRequirement(name = "bearer-jwt")
public class MedecinController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'GESTIONNAIRE', 'MEDECIN')")
    @Operation(summary = "List all doctors", description = "Retrieve a paginated list of all active doctors")
    public ResponseEntity<Page<UserResponse>> getAllDoctors(Pageable pageable) {
        log.info("Fetching all doctors, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<User> doctors = userService.findDoctors(pageable);
        Page<UserResponse> response = doctors.map(userService::toUserResponse);
        return ResponseEntity.ok(response);
    }
}
