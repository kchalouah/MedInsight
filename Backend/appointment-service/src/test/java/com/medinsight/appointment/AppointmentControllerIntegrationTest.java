package com.medinsight.appointment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.appointment.dto.AppointmentRequest;
import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.AppointmentStatus;
import com.medinsight.appointment.repository.AppointmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppointmentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AppointmentRepository appointmentRepository;

    @Test
    @DisplayName("POST /api/appointments - Success as Patient")
    void createAppointment_Success() throws Exception {
        UUID patientId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();

        AppointmentRequest request = AppointmentRequest.builder()
                .patientId(patientId)
                .doctorId(doctorId)
                .appointmentDateTime(LocalDateTime.now().plusDays(2))
                .reason("Checkup")
                .build();

        Appointment savedAppointment = Appointment.builder()
                .id(UUID.randomUUID())
                .patientId(patientId)
                .doctorId(doctorId)
                .appointmentDateTime(request.getAppointmentDateTime())
                .status(AppointmentStatus.SCHEDULED)
                .build();

        when(appointmentRepository.save(any())).thenReturn(savedAppointment);

        mockMvc.perform(post("/api/appointments")
                        .with(jwt().jwt(builder -> builder.subject(patientId.toString()))
                                .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    @DisplayName("GET /api/appointments/{id} - Success")
    void getAppointment_Success() throws Exception {
        UUID id = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        Appointment appointment = Appointment.builder()
                .id(id)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .appointmentDateTime(LocalDateTime.now().plusDays(1))
                .status(AppointmentStatus.SCHEDULED)
                .build();

        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));

        mockMvc.perform(get("/api/appointments/" + id)
                        .with(jwt().jwt(builder -> builder.subject(patientId.toString()))
                                .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @DisplayName("GET /api/appointments/{id} - Forbidden for other user")
    void getAppointment_Forbidden() throws Exception {
        UUID id = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        Appointment appointment = Appointment.builder()
                .id(id)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .appointmentDateTime(LocalDateTime.now().plusDays(1))
                .status(AppointmentStatus.SCHEDULED)
                .build();

        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));

        mockMvc.perform(get("/api/appointments/" + id)
                        .with(jwt().jwt(builder -> builder.subject(otherUserId.toString()))
                                .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_PATIENT"))))
                .andExpect(status().isForbidden());
    }
}
