package com.medinsight.audit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String serviceName;

    private String userId;
    private String userEmail;
    private String userRole;

    private String action;

    private String resourceId;

    private String status; // SUCCESS, FAILURE

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;
}
