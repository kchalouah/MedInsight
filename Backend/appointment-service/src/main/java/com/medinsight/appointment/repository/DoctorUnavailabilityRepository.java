package com.medinsight.appointment.repository;

import com.medinsight.appointment.entity.DoctorUnavailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorUnavailabilityRepository extends JpaRepository<DoctorUnavailability, UUID> {

    /**
     * Find all unavailability periods for a doctor
     */
    List<DoctorUnavailability> findByDoctorId(UUID doctorId);

    /**
     * Find unavailability periods that overlap with a given time range
     */
    @Query("SELECT u FROM DoctorUnavailability u WHERE u.doctorId = :doctorId " +
            "AND u.startDateTime < :endDateTime AND u.endDateTime > :startDateTime")
    List<DoctorUnavailability> findOverlappingUnavailability(
            @Param("doctorId") UUID doctorId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * Find future unavailability periods for a doctor
     */
    @Query("SELECT u FROM DoctorUnavailability u WHERE u.doctorId = :doctorId " +
            "AND u.endDateTime > :now ORDER BY u.startDateTime")
    List<DoctorUnavailability> findFutureUnavailability(
            @Param("doctorId") UUID doctorId,
            @Param("now") LocalDateTime now);

    /**
     * Delete past unavailability periods (cleanup)
     */
    @Query("DELETE FROM DoctorUnavailability u WHERE u.endDateTime < :cutoffDate")
    void deletePastUnavailability(@Param("cutoffDate") LocalDateTime cutoffDate);
}
