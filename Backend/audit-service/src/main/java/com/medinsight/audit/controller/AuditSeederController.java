package com.medinsight.audit.controller;

import com.medinsight.audit.dto.AuditLogRequest;
import com.medinsight.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Random;

@RestController
@RequestMapping("/audit/seed")
@RequiredArgsConstructor
@Tag(name = "Audit Seeder", description = "Temporary tool to generate sample audit logs")
public class AuditSeederController {

    private final AuditService auditService;
    private final Random random = new Random();

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Seed sample audit logs", description = "Generates 20 random logs for testing the dashboard")
    public ResponseEntity<String> seedLogs() {
        String[] services = { "auth-service", "appointment-service", "medical-record-service", "mail-service" };
        String[] users = { "admin-system", "dr.house@medinsight.com", "m.smith@gmail.com", "gestionnaire-1" };
        String[] roles = { "ROLE_ADMIN", "ROLE_MEDECIN", "ROLE_PATIENT", "ROLE_GESTIONNAIRE" };
        String[] actions = { "LOGIN", "LOGOUT", "VIEW_PATIENT_DOSSIER", "UPDATE_PRESCRIPTION", "DELETE_USER",
                "SEND_MAIL", "ACCESS_DATABASE" };
        String[] statuses = { "SUCCESS", "SUCCESS", "SUCCESS", "FAILURE", "SUCCESS" }; // Weighted success

        for (int i = 0; i < 20; i++) {
            int userIdx = random.nextInt(users.length);
            AuditLogRequest request = AuditLogRequest.builder()
                    .serviceName(services[random.nextInt(services.length)])
                    .userId("USR-" + (1000 + i))
                    .userEmail(users[userIdx])
                    .userRole(roles[userIdx])
                    .action(actions[random.nextInt(actions.length)])
                    .status(statuses[random.nextInt(statuses.length)])
                    .details("Généré automatiquement pour le test du tableau de bord d'audit (" + i + ")")
                    .ipAddress("192.168.1." + (10 + i))
                    .resourceId("RES-" + (1000 + i))
                    .build();
            auditService.storeLog(request);
        }

        return ResponseEntity.ok("20 logs d'audit générés avec succès.");
    }
}
