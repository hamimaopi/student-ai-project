package com.studentai.project.ai;

import com.studentai.project.classroom.Scenario;
import com.studentai.project.message.Message;
import com.studentai.project.message.SenderType;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PromptBuilderTest {

    private PromptBuilder promptBuilder;
    private Student student;
    private Scenario scenario;
    private StudentMentalModel mentalModel;

    @BeforeEach
    void setUp() {
        promptBuilder = new PromptBuilder();

        student = Student.builder()
                .id(UUID.randomUUID())
                .name("Sue")
                .gradeLevel("8th grade")
                .personality("Neurodiverse student learning science. Thoughtful and occasionally hesitant. Occasionally uses 'maybe'.")
                .avatarUrl("/images/avatar_sue.jpg")
                .build();

        scenario = Scenario.builder()
                .id(UUID.randomUUID())
                .title("The Cold Virus Spread")
                .description("Sam was sick with a cold. She sat near Anthony in class. Later Anthony got tired playing basketball and got sick.")
                .build();

        mentalModel = StudentMentalModel.builder()
                .id(UUID.randomUUID())
                .student(student)
                .scenario(scenario)
                .wrongBelief("Running hard in basketball directly caused Anthony's cold.")
                .whyItFeelsRight("He felt exhausted immediately during the game and woke up sick the next morning.")
                .defenses(List.of("He was totally fine before the game!", "Exhaustion breaks your body down."))
                .build();
    }

    @Test
    @DisplayName("System prompt includes identity, persona, rules, and misconception")
    void testBuildSystemPromptContainsCoreElements() {
        String prompt = promptBuilder.buildSystemPrompt(
                student,
                scenario,
                mentalModel,
                StudentState.CONFIDENTLY_WRONG,
                0,
                "Initial start."
        );

        assertNotNull(prompt);
        assertTrue(prompt.contains("You are Sue, a 8th grade student"));
        assertTrue(prompt.contains("Neurodiverse student learning science"));
        assertTrue(prompt.contains("The Cold Virus Spread"));
        assertTrue(prompt.contains("Running hard in basketball directly caused Anthony's cold."));
        assertTrue(prompt.contains("He was totally fine before the game!"));
        assertTrue(prompt.contains("CONFIDENTLY_WRONG"));
        assertTrue(prompt.contains("Do NOT start every sentence with 'Um'"));
        assertTrue(prompt.contains("Initial start."));
    }

    @Test
    @DisplayName("DEFENSIVE state instructions change when turnsInState >= 3 (softening)")
    void testDefensiveSoftensAfterThreeTurns() {
        String promptEarly = promptBuilder.buildSystemPrompt(
                student,
                scenario,
                mentalModel,
                StudentState.DEFENSIVE,
                1,
                null
        );

        assertTrue(promptEarly.contains("Push back against what the teacher is saying"));

        String promptSoftened = promptBuilder.buildSystemPrompt(
                student,
                scenario,
                mentalModel,
                StudentState.DEFENSIVE,
                3,
                null
        );

        assertTrue(promptSoftened.contains("Softening"));
        assertTrue(promptSoftened.contains("ask why everyone keeps talking about Sam"));
    }

    @Test
    @DisplayName("Conversation history formats speaker names and labels correctly")
    void testBuildConversationHistory() {
        List<Message> messages = new ArrayList<>();
        messages.add(Message.builder()
                .senderType(SenderType.TEACHER)
                .content("What do you think happened to Anthony?")
                .build());
        messages.add(Message.builder()
                .senderType(SenderType.STUDENT)
                .student(student)
                .content("Basketball made him sick because he ran so hard.")
                .build());

        String history = promptBuilder.buildConversationHistory(messages, "Sue");

        assertTrue(history.contains("Teacher: What do you think happened to Anthony?"));
        assertTrue(history.contains("Sue: Basketball made him sick because he ran so hard."));
    }

    @Test
    @DisplayName("Conversation history truncates to last 8 messages if longer")
    void testBuildConversationHistoryTruncatesWindow() {
        List<Message> messages = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            messages.add(Message.builder()
                    .senderType(i % 2 == 1 ? SenderType.TEACHER : SenderType.STUDENT)
                    .content("Turn " + i)
                    .build());
        }

        String history = promptBuilder.buildConversationHistory(messages, "Sue");

        assertFalse(history.contains("Turn 1\n"));
        assertFalse(history.contains("Turn 4\n"));
        assertTrue(history.contains("Turn 5"));
        assertTrue(history.contains("Turn 12"));
    }

    @Test
    @DisplayName("Conversation history handles empty or null list gracefully")
    void testBuildConversationHistoryEmpty() {
        String historyEmpty = promptBuilder.buildConversationHistory(List.of(), "Sue");
        assertEquals("No prior messages. This is the start of the discussion.", historyEmpty);

        String historyNull = promptBuilder.buildConversationHistory(null, "Sue");
        assertEquals("No prior messages. This is the start of the discussion.", historyNull);
    }
}
