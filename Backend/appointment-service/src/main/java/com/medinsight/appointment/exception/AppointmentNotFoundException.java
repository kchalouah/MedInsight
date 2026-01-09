package com.medinsight.appointment.exception;

/**
 * Exception thrown when an appointment is not found.
 */
public class AppointmentNotFoundException extends RuntimeException {
    public AppointmentNotFoundException(String message) {
        super(message);
    }
}
