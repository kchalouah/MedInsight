package com.medinsight.auth.exception;

/**
 * Exception thrown when Keycloak integration fails.
 */
public class KeycloakIntegrationException extends RuntimeException {
    public KeycloakIntegrationException(String message) {
        super(message);
    }

    public KeycloakIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
