package com.medinsight.audit;

import com.medinsight.audit.dto.AuditLogRequest;
import com.medinsight.audit.entity.AuditLog;
import com.medinsight.audit.repository.AuditLogRepository;
import com.medinsight.audit.service.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
public class AuditServiceTest {

    @Autowired
    private AuditService auditService;

    @MockBean
    private AuditLogRepository auditLogRepository;

    @Test
    public void testStoreLog() {
        AuditLogRequest request = AuditLogRequest.builder()
                .serviceName("test-service")
                .action("TEST_ACTION")
                .status("SUCCESS")
                .build();

        AuditLog savedLog = AuditLog.builder()
                .id("1")
                .action("TEST_ACTION")
                .build();

        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(savedLog);

        AuditLog result = auditService.storeLog(request);

        assertEquals("TEST_ACTION", result.getAction());
        assertEquals("1", result.getId());
    }
}
