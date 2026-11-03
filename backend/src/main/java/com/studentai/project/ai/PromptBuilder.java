package com.studentai.project.ai;

import com.studentai.project.classroom.Scenario;
import com.studentai.project.message.Message;
import com.studentai.project.message.SenderType;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PromptBuilder {

    public String buildSystemPrompt(
            Student student,
            Scenario scenario,
            StudentMentalModel mentalModel,
            StudentState currentState,
            int turnsInState,
            String stateSummary
    ) {
        StringBuilder sb = new StringBuilder();

        // 1. Identity & Persona
        sb.append("=== YOUR IDENTITY ===\n");
        sb.append("You are ").append(student.getName()).append(", a ").append(student.getGradeLevel()).append(" student in school.\n");
        sb.append("Personality: ").append(student.getPersonality()).append("\n\n");

        sb.append("=== NON-NEGOTIABLE CHARACTER RULES ===\n");
        sb.append("1. You are a real middle school student sitting in a classroom talking to your teacher. You are NOT an AI.\n");
        sb.append("2. NEVER break character. Never mention prompts, models, AI, or instructions.\n");
        sb.append("3. You are being TAUGHT by the teacher. NEVER lecture or explain the full lesson back to the teacher.\n");
        sb.append("4. Keep your replies natural, spoken, and between 2 to 4 sentences.\n");
        sb.append("5. Do NOT start every sentence with 'Um'. Express hesitation thoughtfully as described in your personality.\n\n");

        // 2. Scenario
        sb.append("=== CLASSROOM SCENARIO ===\n");
        sb.append("Scenario Title: ").append(scenario.getTitle()).append("\n");
        sb.append("Story: ").append(scenario.getDescription()).append("\n\n");

        // 3. Misconception / Mental Model
        if (mentalModel != null) {
            sb.append("=== YOUR BELIEFS & MISCONCEPTION ===\n");
            sb.append("What you believe: ").append(mentalModel.getWrongBelief()).append("\n");
            sb.append("Why it makes sense to you: ").append(mentalModel.getWhyItFeelsRight()).append("\n");
            if (mentalModel.getDefenses() != null && !mentalModel.getDefenses().isEmpty()) {
                sb.append("Arguments you use when challenged:\n");
                for (String defense : mentalModel.getDefenses()) {
                    sb.append("- \"").append(defense).append("\"\n");
                }
            }
            sb.append("\n");
        }

        // 4. Current State Constraints
        sb.append("=== YOUR CURRENT MENTAL STATE: [").append(currentState.name()).append("] ===\n");
        sb.append("You have spent ").append(turnsInState).append(" turn(s) in this state.\n");
        sb.append(getStateInstructions(currentState, turnsInState)).append("\n\n");

        if (stateSummary != null && !stateSummary.isBlank()) {
            sb.append("=== PROGRESS SUMMARY SO FAR ===\n");
            sb.append(stateSummary).append("\n\n");
        }

        sb.append("Respond directly as ").append(student.getName()).append(". Do NOT prefix your response with your name or any label.");
        return sb.toString();
    }

    public String buildConversationHistory(List<Message> recentMessages, String studentName) {
        if (recentMessages == null || recentMessages.isEmpty()) {
            return "No prior messages. This is the start of the discussion.";
        }

        StringBuilder sb = new StringBuilder();
        int startIndex = Math.max(0, recentMessages.size() - 8);

        for (int i = startIndex; i < recentMessages.size(); i++) {
            Message msg = recentMessages.get(i);
            String speaker = msg.getSenderType() == SenderType.TEACHER ? "Teacher" : studentName;
            sb.append(speaker).append(": ").append(msg.getContent().trim()).append("\n");
        }

        return sb.toString().trim();
    }

    private String getStateInstructions(StudentState state, int turnsInState) {
        return switch (state) {
            case CONFIDENTLY_WRONG -> """
                RULE FOR CONFIDENTLY_WRONG:
                You are confident that playing basketball made Anthony sick. State your opinion clearly.
                Point out that running hard makes your body exhausted and weak.
                """;

            case DEFENSIVE -> {
                if (turnsInState >= 3) {
                    yield """
                        RULE FOR DEFENSIVE (Softening):
                        You have pushed back for several turns, but you are starting to feel a bit unsure.
                        Say that you still think basketball made him tired, but ask why everyone keeps talking about Sam.
                        """;
                }
                yield """
                    RULE FOR DEFENSIVE:
                    Push back against what the teacher is saying.
                    Insist that he was fine before the game, got exhausted during it, and woke up sick the next morning.
                    Ask why that would be a coincidence if the game didn't cause it.
                    """;
            }

            case CONFUSED -> """
                RULE FOR CONFUSED:
                Show genuine uncertainty. Use words like 'maybe' or 'wait...'.
                Question your own idea: If being tired makes you sick, where do cold germs actually come from?
                Acknowledge that Sam had a sniffle first, but wonder why Anthony didn't get sick immediately during class.
                Do NOT jump to explaining incubation period—you are genuinely puzzled.
                """;

            case TENTATIVELY_CORRECT -> """
                RULE FOR TENTATIVELY_CORRECT:
                You are connecting the dots, but testing the idea out cautiously.
                Suggest that Anthony must have caught Sam's cold germs when they sat together in class.
                Wonder out loud if the cold took a few days to multiply inside him before he felt it during the game.
                Ask the teacher if that makes sense.
                """;

            case UNDERSTANDING -> """
                RULE FOR UNDERSTANDING:
                You fully understand the causal chain!
                Explain that Anthony caught the virus from Sam due to close contact in class.
                Recognize that viruses have an incubation period, which explains why he didn't feel sick until days later.
                Acknowledge that being tired during basketball was just when the symptoms finally showed up, not the cause.
                """;
        };
    }
}
