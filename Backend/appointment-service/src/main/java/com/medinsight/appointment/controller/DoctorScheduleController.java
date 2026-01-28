package com.medinsight.appointment.controller;

import com.medinsight.appointment.dto.DoctorScheduleRequest;
import com.medinsight.appointment.dto.DoctorScheduleResponse;
import com.medinsight.appointment.entity.DoctorUnavailability;
import com.medinsight.appointment.service.DoctorScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Controller for doctor schedule management
 */
@RestController
@RequestMapping("/appointments/schedule")
@RequiredArgsConstructor
@Slf4j
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;

    /**
     * Create or update doctor schedule
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<DoctorScheduleResponse> createOrUpdateSchedule(
            @Valid @RequestBody DoctorScheduleRequest request) {

        log.info("Creating/updating schedule for doctor {}", request.getDoctorId());
        DoctorScheduleResponse response = scheduleService.createOrUpdateSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get doctor's schedule
     */
    @GetMapping("/{doctorId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<List<DoctorScheduleResponse>> getDoctorSchedule(
            @PathVariable UUID doctorId) {

        log.info("Fetching schedule for doctor {}", doctorId);
        List<DoctorScheduleResponse> schedules = scheduleService.getDoctorSchedules(doctorId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Create default schedule for a doctor
     */
    @PostMapping("/{doctorId}/default")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<List<DoctorScheduleResponse>> createDefaultSchedule(
            @PathVariable UUID doctorId) {

        log.info("Creating default schedule for doctor {}", doctorId);
        List<DoctorScheduleResponse> schedules = scheduleService.createDefaultSchedule(doctorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(schedules);
    }

    /**
     * Delete schedule
     */
    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID scheduleId) {
        log.info("Deleting schedule {}", scheduleId);
        scheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add unavailability period
     */
    @PostMapping("/unavailability")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<DoctorUnavailability> addUnavailability(
            @RequestParam UUID doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDateTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDateTime,
            @RequestParam(required = false) String reason) {

        log.info("Adding unavailability for doctor {} from {} to {}", doctorId, startDateTime, endDateTime);
        DoctorUnavailability unavailability = scheduleService.addUnavailability(
                doctorId, startDateTime, endDateTime, reason);
        return ResponseEntity.status(HttpStatus.CREATED).body(unavailability);
    }

    /**
     * Get future unavailability periods
     */
    @GetMapping("/unavailability/{doctorId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<List<DoctorUnavailability>> getFutureUnavailability(
            @PathVariable UUID doctorId) {

        log.info("Fetching future unavailability for doctor {}", doctorId);
        List<DoctorUnavailability> unavailabilities = scheduleService.getFutureUnavailability(doctorId);
        return ResponseEntity.ok(unavailabilities);
    }

    /**
     * Delete unavailability period
     */
    @DeleteMapping("/unavailability/{unavailabilityId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<Void> deleteUnavailability(@PathVariable UUID unavailabilityId) {
        log.info("Deleting unavailability {}", unavailabilityId);
        scheduleService.deleteUnavailability(unavailabilityId);
        return ResponseEntity.noContent().build();
    }
}
