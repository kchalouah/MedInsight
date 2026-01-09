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
public class ConsultationNoteResponse {
    private UUID id;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private String noteContent;
    private LocalDateTime createdAt;
}
