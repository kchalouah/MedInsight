package com.medinsight.record.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalAppointmentResponse {
    private UUID id;
    private UUID patientId;
    private UUID doctorId;
    private LocalDateTime appointmentDateTime;
    private String status;
    private String reason;
    private String notes;
}
