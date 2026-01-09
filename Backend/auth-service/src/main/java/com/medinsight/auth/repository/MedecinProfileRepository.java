package com.medinsight.auth.repository;

import com.medinsight.auth.entity.MedecinProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for MedecinProfile entity operations.
 */
@Repository
public interface MedecinProfileRepository extends JpaRepository<MedecinProfile, UUID> {

    Optional<MedecinProfile> findByUserId(UUID userId);

    boolean existsByLicenseNumber(String licenseNumber);
}
