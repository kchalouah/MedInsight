package com.medinsight.appointment.exception;

/**
 * Exception thrown when appointment conflicts occur.
 */
public class AppointmentConflictException extends RuntimeException {
    public AppointmentConflictException(String message) {
        super(message);
    }
}
