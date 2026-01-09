package com.medinsight.appointment.exception;

/**
 * Exception thrown when access is unauthorized.
 */
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
