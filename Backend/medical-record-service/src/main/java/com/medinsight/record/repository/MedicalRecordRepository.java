package com.medinsight.record.repository;

import com.medinsight.record.entity.PatientMedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalRecordRepository extends JpaRepository<PatientMedicalRecord, UUID> {
    Optional<PatientMedicalRecord> findByPatientId(UUID patientId);
}
