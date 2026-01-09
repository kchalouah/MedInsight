package com.medinsight.audit.repository;

import com.medinsight.audit.entity.AuditLog;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends ElasticsearchRepository<AuditLog, String> {
    List<AuditLog> findByUserId(String userId);
    List<AuditLog> findByServiceName(String serviceName);
    List<AuditLog> findByAction(String action);
}
