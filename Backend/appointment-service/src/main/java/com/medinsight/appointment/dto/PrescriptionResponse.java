package com.medinsight.appointment.dto;

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
public class PrescriptionResponse {
    private UUID id;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private String medicationName;
    private String dosage;
    private String duration;
    private String instructions;
    private LocalDateTime issuedAt;
}
