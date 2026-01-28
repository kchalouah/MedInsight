package com.medinsight.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing periods when a doctor is unavailable.
 * Used for vacations, conferences, sick days, etc.
 */
@Entity
@Table(name = "doctor_unavailability", indexes = {
        @Index(name = "idx_unavailability_doctor", columnList = "doctor_id"),
        @Index(name = "idx_unavailability_dates", columnList = "start_date_time, end_date_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorUnavailability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "start_date_time", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time", nullable = false)
    private LocalDateTime endDateTime;

    @Column(length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Validates that end time is after start time
     */
    @PrePersist
    @PreUpdate
    private void validateDates() {
        if (endDateTime != null && startDateTime != null && !endDateTime.isAfter(startDateTime)) {
            throw new IllegalArgumentException("End date/time must be after start date/time");
        }
    }
}
