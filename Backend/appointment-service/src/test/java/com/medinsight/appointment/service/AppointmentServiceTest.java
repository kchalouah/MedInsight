package com.medinsight.appointment.service;

import com.medinsight.appointment.dto.*;
import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.AppointmentStatus;
import com.medinsight.appointment.exception.AppointmentConflictException;
import com.medinsight.appointment.exception.AppointmentNotFoundException;
import com.medinsight.appointment.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private UUID patientId;
    private UUID doctorId;
    private UUID appointmentId;
    private Appointment appointment;
    private Authentication authentication;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
        appointmentId = UUID.randomUUID();

        appointment = Appointment.builder()
                .id(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .appointmentDateTime(LocalDateTime.now().plusDays(1))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Test checkup")
                .build();

        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(patientId.toString());
        
        authentication = mock(Authentication.class);
        doReturn(jwt).when(authentication).getPrincipal();
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .when(authentication).getAuthorities();
    }

    @Test
    @DisplayName("Should create appointment successfully")
    void createAppointment_Success() {
        AppointmentRequest request = AppointmentRequest.builder()
                .patientId(patientId)
                .doctorId(doctorId)
                .appointmentDateTime(LocalDateTime.now().plusDays(1))
                .reason("Consultation")
                .build();

        when(appointmentRepository.findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        AppointmentResponse response = appointmentService.createAppointment(request, authentication);

        assertThat(response).isNotNull();
        assertThat(response.getPatientId()).isEqualTo(patientId);
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should throw exception when doctor has conflict")
    void createAppointment_Conflict() {
        AppointmentRequest request = AppointmentRequest.builder()
                .patientId(patientId)
                .doctorId(doctorId)
                .appointmentDateTime(LocalDateTime.now().plusDays(1))
                .build();

        when(appointmentRepository.findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                any(), any(), any(), any()))
                .thenReturn(List.of(appointment));

        assertThatThrownBy(() -> appointmentService.createAppointment(request, authentication))
                .isInstanceOf(AppointmentConflictException.class);
    }

    @Test
    @DisplayName("Should get appointment successfully")
    void getAppointment_Success() {
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appointment));

        AppointmentResponse response = appointmentService.getAppointment(appointmentId, authentication);

        assertThat(response.getId()).isEqualTo(appointmentId);
    }

    @Test
    @DisplayName("Should throw exception when appointment not found")
    void getAppointment_NotFound() {
        when(appointmentRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.getAppointment(UUID.randomUUID(), authentication))
                .isInstanceOf(AppointmentNotFoundException.class);
    }

    @Test
    @DisplayName("Should update appointment status")
    void updateAppointment_Success() {
        AppointmentUpdateRequest updateRequest = AppointmentUpdateRequest.builder()
                .status(AppointmentStatus.COMPLETED)
                .build();

        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        AppointmentResponse response = appointmentService.updateAppointment(appointmentId, updateRequest, authentication);

        assertThat(response).isNotNull();
        verify(appointmentRepository).save(any());
    }
}
