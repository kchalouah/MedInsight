package com.medinsight.appointment.dto;

import com.medinsight.appointment.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for filtering appointments.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentFilterRequest {

    private UUID patientId;
    private UUID doctorId;
    private AppointmentStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
