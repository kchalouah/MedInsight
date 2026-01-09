package com.medinsight.auth.config;

import com.medinsight.auth.entity.Role;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Component to initialize database data on startup.
 * Focuses on seeding system roles.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        log.info("Checking for initial system roles...");
        
        Arrays.stream(RoleEnum.values()).forEach(roleEnum -> {
            if (!roleRepository.existsByName(roleEnum)) {
                log.info("Seeding missing role: {}", roleEnum);
                Role role = Role.builder()
                        .name(roleEnum)
                        .description("System role for " + roleEnum.name())
                        .build();
                roleRepository.save(role);
            }
        });
        
        log.info("Database initialization complete.");
    }
}
