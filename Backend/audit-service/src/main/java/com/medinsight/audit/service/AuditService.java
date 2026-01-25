package com.medinsight.audit.service;

import com.medinsight.audit.dto.AuditLogRequest;
import com.medinsight.audit.entity.AuditLog;
import com.medinsight.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog storeLog(AuditLogRequest request) {
        log.info("Storing audit log for action: {} from service: {}", request.getAction(), request.getServiceName());

        AuditLog auditLog = AuditLog.builder()
                .timestamp(LocalDateTime.now())
                .serviceName(request.getServiceName())
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .userRole(request.getUserRole())
                .action(request.getAction())
                .resourceId(request.getResourceId())
                .status(request.getStatus())
                .details(request.getDetails())
                .ipAddress(request.getIpAddress())
                .build();

        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getAllLogs() {
        return StreamSupport.stream(auditLogRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }

    public List<AuditLog> getLogsByUser(String userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public List<AuditLog> getLogsByService(String serviceName) {
        return auditLogRepository.findByServiceName(serviceName);
    }
}
