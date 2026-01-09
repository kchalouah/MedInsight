package com.medinsight.record.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ConsultationNoteRequest {
    @NotNull(message = "Appointment ID is required")
    private UUID appointmentId;
    @NotNull(message = "Patient ID is required")
    private UUID patientId;
    @NotBlank(message = "Note content is required")
    private String noteContent;
}
