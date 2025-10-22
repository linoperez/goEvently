package com.goevently.eventservice.exception;

/**
 * Custom exception for event-related errors.
 */
public class EventException extends RuntimeException {
    public EventException(String message) {
        super(message);
    }

    public EventException(String message, Throwable cause) {
        super(message, cause);
    }
}
