package com.medinsight.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a doctor's professional profile.
 * OneToOne relationship with User entity.
 */
@Entity
@Table(name = "medecin_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedecinProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 100)
    private String specialization;

    @Column(name = "license_number", unique = true, length = 50)
    private String licenseNumber;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;
}
