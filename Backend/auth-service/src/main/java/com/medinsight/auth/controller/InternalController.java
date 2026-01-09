package com.medinsight.auth.controller;

import com.medinsight.auth.dto.UserResponse;
import com.medinsight.auth.entity.User;
import com.medinsight.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for internal service-to-service communication.
 */
@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Internal", description = "Internal service-to-service endpoints")
public class InternalController {

    private final UserService userService;

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID", description = "Internal endpoint for other microservices to fetch user details")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        log.debug("Internal request to fetch user with ID: {}", id);
        User user = userService.findById(id);
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    @GetMapping("/users/keycloak/{keycloakId}")
    @Operation(summary = "Get user by Keycloak ID", description = "Internal endpoint to fetch user by Keycloak ID")
    public ResponseEntity<UserResponse> getUserByKeycloakId(@PathVariable String keycloakId) {
        log.debug("Internal request to fetch user with Keycloak ID: {}", keycloakId);
        User user = userService.findByKeycloakId(keycloakId);
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    @GetMapping("/users/email/{email}")
    @Operation(summary = "Get user by email", description = "Internal endpoint to fetch user by email")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        log.debug("Internal request to fetch user with email: {}", email);
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(userService.toUserResponse(user));
    }
}
