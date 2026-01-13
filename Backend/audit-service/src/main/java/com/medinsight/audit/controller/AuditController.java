package com.medinsight.audit.controller;

import com.medinsight.audit.dto.AuditLogRequest;
import com.medinsight.audit.entity.AuditLog;
import com.medinsight.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Audit Logs", description = "Centralized audit logging and querying")
@SecurityRequirement(name = "bearer-jwt")
public class AuditController {

    private final AuditService auditService;

    @PostMapping("/logs")
    @Operation(summary = "Store an audit log", description = "Usually called internally by other services")
    public ResponseEntity<AuditLog> storeLog(@Valid @RequestBody AuditLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.storeLog(request));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('RESPONSABLE_SECURITE', 'ADMIN')")
    @Operation(summary = "Query all audit logs", description = "Restricted to security officers and admins")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditService.getAllLogs());
    }

    @GetMapping("/logs/user/{userId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_SECURITE', 'ADMIN')")
    @Operation(summary = "Query logs by user ID")
    public ResponseEntity<List<AuditLog>> getLogsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(auditService.getLogsByUser(userId));
    }

    @GetMapping("/logs/service/{serviceName}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_SECURITE', 'ADMIN')")
    @Operation(summary = "Query logs by service name")
    public ResponseEntity<List<AuditLog>> getLogsByService(@PathVariable String serviceName) {
        return ResponseEntity.ok(auditService.getLogsByService(serviceName));
    }
}
