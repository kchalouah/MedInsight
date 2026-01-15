package com.medinsight.auth.repository;

import com.medinsight.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByKeycloakId(String keycloakId);

    boolean existsByEmail(String email);

    boolean existsByKeycloakId(String keycloakId);

    org.springframework.data.domain.Page<User> findAllByMedecinProfileIsNotNull(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findAllByPatientProfileIsNotNull(org.springframework.data.domain.Pageable pageable);

    void deleteByKeycloakId(String keycloakId);
}
