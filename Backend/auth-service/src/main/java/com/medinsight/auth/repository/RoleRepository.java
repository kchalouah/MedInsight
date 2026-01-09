package com.medinsight.auth.repository;

import com.medinsight.auth.entity.Role;
import com.medinsight.auth.entity.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Role entity operations.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RoleEnum name);

    boolean existsByName(RoleEnum name);
}
