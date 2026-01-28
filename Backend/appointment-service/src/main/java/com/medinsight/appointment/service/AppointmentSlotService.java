package com.medinsight.appointment.service;

import com.medinsight.appointment.dto.TimeSlotDTO;
import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.AppointmentStatus;
import com.medinsight.appointment.entity.DoctorSchedule;
import com.medinsight.appointment.entity.DoctorUnavailability;
import com.medinsight.appointment.repository.AppointmentRepository;
import com.medinsight.appointment.repository.DoctorScheduleRepository;
import com.medinsight.appointment.repository.DoctorUnavailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing appointment time slots
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentSlotService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorUnavailabilityRepository unavailabilityRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Get available time slots for a doctor on a specific date
     */
    public List<TimeSlotDTO> getAvailableSlots(UUID doctorId, LocalDate date) {
        log.info("Getting available slots for doctor {} on {}", doctorId, date);

        // Get doctor's schedule for this day of week
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        Optional<DoctorSchedule> scheduleOpt = scheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dayOfWeek);

        if (scheduleOpt.isEmpty()) {
            log.debug("No schedule found for doctor {} on {}", doctorId, dayOfWeek);
            return List.of();
        }

        DoctorSchedule schedule = scheduleOpt.get();

        // Generate all possible slots for the day
        List<TimeSlotDTO> allSlots = generateTimeSlots(schedule, date);

        // Get existing appointments for this doctor on this date
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);
        List<Appointment> existingAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                        doctorId, dayStart, dayEnd, AppointmentStatus.CANCELLED);

        // Get unavailability periods
        List<DoctorUnavailability> unavailabilities = unavailabilityRepository
                .findOverlappingUnavailability(doctorId, dayStart, dayEnd);

        // Mark slots as booked or unavailable
        return allSlots.stream()
                .map(slot -> markSlotStatus(slot, existingAppointments, unavailabilities))
                .collect(Collectors.toList());
    }

    /**
     * Generate time slots based on schedule
     */
    private List<TimeSlotDTO> generateTimeSlots(DoctorSchedule schedule, LocalDate date) {
        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime currentTime = schedule.getStartTime();
        LocalTime endTime = schedule.getEndTime();
        int slotDuration = schedule.getSlotDurationMinutes();

        LocalDateTime now = LocalDateTime.now();

        while (currentTime.plusMinutes(slotDuration).isBefore(endTime) ||
                currentTime.plusMinutes(slotDuration).equals(endTime)) {

            LocalDateTime slotStart = LocalDateTime.of(date, currentTime);
            LocalDateTime slotEnd = slotStart.plusMinutes(slotDuration);

            // Only include future slots
            if (slotStart.isAfter(now)) {
                slots.add(TimeSlotDTO.builder()
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .durationMinutes(slotDuration)
                        .isAvailable(true)
                        .status("AVAILABLE")
                        .build());
            }

            currentTime = currentTime.plusMinutes(slotDuration);
        }

        return slots;
    }

    /**
     * Mark slot status based on existing appointments and unavailability
     */
    private TimeSlotDTO markSlotStatus(
            TimeSlotDTO slot,
            List<Appointment> appointments,
            List<DoctorUnavailability> unavailabilities) {

        // Check if slot overlaps with unavailability
        boolean isUnavailable = unavailabilities.stream()
                .anyMatch(u -> isTimeOverlapping(
                        slot.getStartTime(), slot.getEndTime(),
                        u.getStartDateTime(), u.getEndDateTime()));

        if (isUnavailable) {
            slot.setIsAvailable(false);
            slot.setStatus("UNAVAILABLE");
            return slot;
        }

        // Check if slot is booked
        boolean isBooked = appointments.stream()
                .anyMatch(a -> isTimeOverlapping(
                        slot.getStartTime(), slot.getEndTime(),
                        a.getAppointmentDateTime(),
                        a.getAppointmentDateTime().plusMinutes(slot.getDurationMinutes())));

        if (isBooked) {
            slot.setIsAvailable(false);
            slot.setStatus("BOOKED");
        }

        return slot;
    }

    /**
     * Check if two time ranges overlap
     */
    private boolean isTimeOverlapping(
            LocalDateTime start1, LocalDateTime end1,
            LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    /**
     * Check if a specific time slot is available
     */
    public boolean isTimeSlotAvailable(UUID doctorId, LocalDateTime appointmentTime, int durationMinutes) {
        LocalDate date = appointmentTime.toLocalDate();
        List<TimeSlotDTO> availableSlots = getAvailableSlots(doctorId, date);

        LocalDateTime slotEnd = appointmentTime.plusMinutes(durationMinutes);

        return availableSlots.stream()
                .anyMatch(slot -> slot.getIsAvailable() &&
                        !slot.getStartTime().isAfter(appointmentTime) &&
                        !slot.getEndTime().isBefore(slotEnd));
    }

    /**
     * Check if appointment time is during doctor's working hours
     */
    public boolean isDuringWorkingHours(UUID doctorId, LocalDateTime appointmentTime) {
        DayOfWeek dayOfWeek = appointmentTime.getDayOfWeek();
        LocalTime time = appointmentTime.toLocalTime();

        Optional<DoctorSchedule> scheduleOpt = scheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dayOfWeek);

        if (scheduleOpt.isEmpty()) {
            return false;
        }

        DoctorSchedule schedule = scheduleOpt.get();
        return !time.isBefore(schedule.getStartTime()) &&
                !time.isAfter(schedule.getEndTime().minusMinutes(schedule.getSlotDurationMinutes()));
    }
}
