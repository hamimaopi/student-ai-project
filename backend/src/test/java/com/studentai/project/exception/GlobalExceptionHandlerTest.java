package com.studentai.project.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test/resource");
    }

    @Test
    @DisplayName("Handles ResourceNotFoundException -> 404 NOT_FOUND")
    void testResourceNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Classroom not found: 123");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().getErrorCode());
        assertEquals("Classroom not found: 123", response.getBody().getMessage());
        assertEquals("/api/test/resource", response.getBody().getPath());
        assertNotNull(response.getBody().getTimestamp());
    }

    @Test
    @DisplayName("Handles SessionStateConflictException -> 409 CONFLICT")
    void testSessionStateConflict() {
        SessionStateConflictException ex = new SessionStateConflictException("Cannot send message to an ended session");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSessionStateConflict(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getStatus());
        assertEquals("SESSION_STATE_CONFLICT", response.getBody().getErrorCode());
        assertEquals("Cannot send message to an ended session", response.getBody().getMessage());
        assertEquals("/api/test/resource", response.getBody().getPath());
    }

    @Test
    @DisplayName("Handles AiServiceUnavailableException -> 503 SERVICE_UNAVAILABLE")
    void testAiServiceUnavailable() {
        AiServiceUnavailableException ex = new AiServiceUnavailableException("Ollama model timeout");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAiServiceUnavailable(ex, request);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(503, response.getBody().getStatus());
        assertEquals("AI_SERVICE_UNAVAILABLE", response.getBody().getErrorCode());
        assertEquals("Ollama model timeout", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handles IllegalArgumentException -> 400 BAD_REQUEST")
    void testIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad input parameter");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("INVALID_ARGUMENT", response.getBody().getErrorCode());
        assertEquals("Bad input parameter", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handles IllegalStateException -> 409 CONFLICT")
    void testIllegalState() {
        IllegalStateException ex = new IllegalStateException("Unexpected state reached");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalState(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getStatus());
        assertEquals("ILLEGAL_STATE", response.getBody().getErrorCode());
        assertEquals("Unexpected state reached", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handles generic Exception -> 500 INTERNAL_SERVER_ERROR")
    void testGeneralException() {
        Exception ex = new RuntimeException("Database connection failed");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getErrorCode());
        assertEquals("An unexpected error occurred. Please try again.", response.getBody().getMessage());
    }
}
