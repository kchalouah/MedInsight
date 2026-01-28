package com.medinsight.appointment.repository;

import com.medinsight.appointment.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, UUID> {

    /**
     * Find all active schedules for a doctor
     */
    List<DoctorSchedule> findByDoctorIdAndIsActiveTrue(UUID doctorId);

    /**
     * Find schedule for a specific doctor and day of week
     */
    Optional<DoctorSchedule> findByDoctorIdAndDayOfWeekAndIsActiveTrue(UUID doctorId, DayOfWeek dayOfWeek);

    /**
     * Find all schedules for a doctor (including inactive)
     */
    List<DoctorSchedule> findByDoctorId(UUID doctorId);

    /**
     * Check if doctor has any active schedule
     */
    boolean existsByDoctorIdAndIsActiveTrue(UUID doctorId);

    /**
     * Delete all schedules for a doctor
     */
    void deleteByDoctorId(UUID doctorId);
}
