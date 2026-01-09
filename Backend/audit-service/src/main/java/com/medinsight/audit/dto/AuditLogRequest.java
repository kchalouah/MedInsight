package com.medinsight.audit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    @NotBlank
    private String serviceName;
    private String userId;
    @NotBlank
    private String action;
    private String resourceId;
    @NotBlank
    private String status;
    private String details;
    private String ipAddress;
}
