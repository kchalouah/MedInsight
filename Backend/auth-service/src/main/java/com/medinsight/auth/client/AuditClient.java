package com.medinsight.auth.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditClient {

    private final WebClient.Builder webClientBuilder;

    public void log(String serviceName, String action, String userId, String userEmail, String userRole, String status,
            String details) {
        AuditLogRequest request = AuditLogRequest.builder()
                .serviceName(serviceName)
                .action(action)
                .userId(userId)
                .userEmail(userEmail)
                .userRole(userRole)
                .status(status)
                .details(details)
                .build();

        webClientBuilder.build()
                .post()
                .uri("http://audit-service:8085/audit/logs")
                .body(Mono.just(request), AuditLogRequest.class)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe(
                        success -> log.debug("Audit log sent successfully"),
                        error -> log.error("Failed to send audit log: {}", error.getMessage()));
    }

    @Data
    @Builder
    public static class AuditLogRequest {
        private String serviceName;
        private String userId;
        private String userEmail;
        private String userRole;
        private String action;
        private String resourceId;
        private String status;
        private String details;
        private String ipAddress;
    }
}
