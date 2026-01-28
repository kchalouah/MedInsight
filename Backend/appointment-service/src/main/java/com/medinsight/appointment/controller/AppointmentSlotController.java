package com.medinsight.appointment.controller;

import com.medinsight.appointment.dto.TimeSlotDTO;
import com.medinsight.appointment.service.AppointmentSlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller for appointment slot operations
 */
@RestController
@RequestMapping("/appointments/slots")
@RequiredArgsConstructor
@Slf4j
public class AppointmentSlotController {

    private final AppointmentSlotService slotService;

    /**
     * Get available time slots for a doctor on a specific date
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<List<TimeSlotDTO>> getAvailableSlots(
            @RequestParam UUID doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.info("Fetching available slots for doctor {} on {}", doctorId, date);
        List<TimeSlotDTO> slots = slotService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(slots);
    }
}
