package com.medinsight.appointment.service;

import com.medinsight.appointment.dto.DoctorScheduleRequest;
import com.medinsight.appointment.dto.DoctorScheduleResponse;
import com.medinsight.appointment.entity.DoctorSchedule;
import com.medinsight.appointment.entity.DoctorUnavailability;
import com.medinsight.appointment.exception.ResourceNotFoundException;
import com.medinsight.appointment.repository.DoctorScheduleRepository;
import com.medinsight.appointment.repository.DoctorUnavailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing doctor schedules and unavailability
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorUnavailabilityRepository unavailabilityRepository;

    /**
     * Create or update doctor schedule for a specific day
     */
    @Transactional
    public DoctorScheduleResponse createOrUpdateSchedule(DoctorScheduleRequest request) {
        log.info("Creating/updating schedule for doctor {} on {}",
                request.getDoctorId(), request.getDayOfWeek());

        // Check if schedule already exists
        DoctorSchedule schedule = scheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(request.getDoctorId(), request.getDayOfWeek())
                .orElse(DoctorSchedule.builder()
                        .doctorId(request.getDoctorId())
                        .dayOfWeek(request.getDayOfWeek())
                        .build());

        // Update fields
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setIsActive(request.getIsActive());

        schedule = scheduleRepository.save(schedule);
        log.info("Schedule saved with ID: {}", schedule.getId());

        return mapToResponse(schedule);
    }

    /**
     * Get all schedules for a doctor
     */
    public List<DoctorScheduleResponse> getDoctorSchedules(UUID doctorId) {
        return scheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create default schedule for a doctor (Mon-Fri, 9-17, 30min slots)
     */
    @Transactional
    public List<DoctorScheduleResponse> createDefaultSchedule(UUID doctorId) {
        log.info("Creating default schedule for doctor {}", doctorId);

        List<DoctorSchedule> schedules = List.of(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY).stream()
                .map(day -> DoctorSchedule.builder()
                        .doctorId(doctorId)
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(17, 0))
                        .slotDurationMinutes(30)
                        .isActive(true)
                        .build())
                .collect(Collectors.toList());

        schedules = scheduleRepository.saveAll(schedules);
        log.info("Created {} default schedules for doctor {}", schedules.size(), doctorId);

        return schedules.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Delete schedule
     */
    @Transactional
    public void deleteSchedule(UUID scheduleId) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        schedule.setIsActive(false);
        scheduleRepository.save(schedule);
        log.info("Deactivated schedule {}", scheduleId);
    }

    /**
     * Add unavailability period
     */
    @Transactional
    public DoctorUnavailability addUnavailability(
            UUID doctorId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            String reason) {

        log.info("Adding unavailability for doctor {} from {} to {}",
                doctorId, startDateTime, endDateTime);

        DoctorUnavailability unavailability = DoctorUnavailability.builder()
                .doctorId(doctorId)
                .startDateTime(startDateTime)
                .endDateTime(endDateTime)
                .reason(reason)
                .build();

        return unavailabilityRepository.save(unavailability);
    }

    /**
     * Get future unavailability periods for a doctor
     */
    public List<DoctorUnavailability> getFutureUnavailability(UUID doctorId) {
        return unavailabilityRepository.findFutureUnavailability(doctorId, LocalDateTime.now());
    }

    /**
     * Delete unavailability period
     */
    @Transactional
    public void deleteUnavailability(UUID unavailabilityId) {
        unavailabilityRepository.deleteById(unavailabilityId);
        log.info("Deleted unavailability {}", unavailabilityId);
    }

    private DoctorScheduleResponse mapToResponse(DoctorSchedule schedule) {
        return DoctorScheduleResponse.builder()
                .id(schedule.getId())
                .doctorId(schedule.getDoctorId())
                .dayOfWeek(schedule.getDayOfWeek())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .slotDurationMinutes(schedule.getSlotDurationMinutes())
                .isActive(schedule.getIsActive())
                .build();
    }
}
