package com.medinsight.appointment.repository;

import com.medinsight.appointment.entity.Appointment;
import com.medinsight.appointment.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Appointment entity operations.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    Page<Appointment> findByPatientId(UUID patientId, Pageable pageable);

    Page<Appointment> findByDoctorId(UUID doctorId, Pageable pageable);

    Page<Appointment> findByStatus(AppointmentStatus status, Pageable pageable);

    Page<Appointment> findByPatientIdAndStatus(UUID patientId, AppointmentStatus status, Pageable pageable);

    Page<Appointment> findByDoctorIdAndStatus(UUID doctorId, AppointmentStatus status, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime BETWEEN :startDate AND :endDate")
    Page<Appointment> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate,
                                       Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId " +
           "AND a.appointmentDateTime BETWEEN :startDate AND :endDate")
    Page<Appointment> findByPatientIdAndDateRange(@Param("patientId") UUID patientId,
                                                    @Param("startDate") LocalDateTime startDate,
                                                    @Param("endDate") LocalDateTime endDate,
                                                    Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId " +
           "AND a.appointmentDateTime BETWEEN :startDate AND :endDate")
    Page<Appointment> findByDoctorIdAndDateRange(@Param("doctorId") UUID doctorId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate,
                                                   Pageable pageable);

    boolean existsByDoctorIdAndAppointmentDateTimeBetween(UUID doctorId,
                                                            LocalDateTime start,
                                                            LocalDateTime end);

    List<Appointment> findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(UUID doctorId,
                                                                                LocalDateTime start,
                                                                                LocalDateTime end,
                                                                                AppointmentStatus status);
}
