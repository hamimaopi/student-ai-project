package com.studentai.project.exception;

public class SessionStateConflictException extends RuntimeException {

    public SessionStateConflictException(String message) {
        super(message);
    }

    public SessionStateConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
