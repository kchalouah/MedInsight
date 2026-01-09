package com.medinsight.auth.entity;

/**
 * Enum representing the roles in the MedInsight system.
 * These roles must match the roles configured in Keycloak.
 */
public enum RoleEnum {
    ADMIN,
    MEDECIN,
    PATIENT,
    GESTIONNAIRE,
    RESPONSABLE_SECURITE
}
