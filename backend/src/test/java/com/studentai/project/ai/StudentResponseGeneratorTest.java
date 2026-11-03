package com.studentai.project.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class StudentResponseGeneratorTest {

    @Mock
    private ChatModel chatModel;

    private StudentResponseGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new StudentResponseGenerator(chatModel);
    }

    @Test
    @DisplayName("Sanitize response strips surrounding double quotes")
    void testSanitizeStripsQuotes() {
        String input = "\"Maybe running hard made his body too exhausted to fight anything off.\"";
        String cleaned = generator.sanitizeResponse(input, "Sue");

        assertEquals("Maybe running hard made his body too exhausted to fight anything off.", cleaned);
    }

    @Test
    @DisplayName("Sanitize response strips student name or 'Student:' prefix")
    void testSanitizeStripsPrefix() {
        String inputWithName = "Sue: But wait, how could he get sick if he was fine during the morning?";
        String cleanedWithName = generator.sanitizeResponse(inputWithName, "Sue");
        assertEquals("But wait, how could he get sick if he was fine during the morning?", cleanedWithName);

        String inputWithStudent = "Student: I still think basketball made him tired.";
        String cleanedWithStudent = generator.sanitizeResponse(inputWithStudent, "Sue");
        assertEquals("I still think basketball made him tired.", cleanedWithStudent);
    }

    @Test
    @DisplayName("Sanitize handles empty or null reply gracefully")
    void testSanitizeHandlesBlank() {
        String cleanedEmpty = generator.sanitizeResponse("", "Sue");
        assertTrue(cleanedEmpty.contains("Maybe..."));

        String cleanedNull = generator.sanitizeResponse(null, "Sue");
        assertTrue(cleanedNull.contains("Maybe..."));
    }
}
