package com.medinsight.record;

import com.medinsight.record.dto.MedicalDossierResponse;
import com.medinsight.record.service.RecordService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MedicalRecordIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecordService recordService;

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testGetDossierAsAdmin() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(recordService.getDetailedDossier(any(), any()))
                .thenReturn(MedicalDossierResponse.builder().patientId(patientId).build());

        mockMvc.perform(get("/api/records/patient/" + patientId + "/dossier")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/records/patient/" + UUID.randomUUID() + "/dossier"))
                .andExpect(status().isUnauthorized());
    }
}
