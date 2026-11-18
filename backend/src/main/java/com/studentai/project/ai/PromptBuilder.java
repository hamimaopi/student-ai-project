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
        return buildSystemPrompt(student, scenario, mentalModel, currentState, turnsInState, stateSummary, null, null);
    }

    public String buildSystemPrompt(
            Student student,
            Scenario scenario,
            StudentMentalModel mentalModel,
            StudentState currentState,
            int turnsInState,
            String stateSummary,
            List<com.studentai.project.session.SessionParticipant> allParticipants,
            String referencedPeerName
    ) {
        StringBuilder sb = new StringBuilder();

        // 1. Identity & Persona
        sb.append("=== YOUR IDENTITY & PEERS ===\n");
        sb.append("You are ").append(student.getName()).append(", a ").append(student.getGradeLevel()).append(" student in school.\n");
        sb.append("Personality: ").append(student.getPersonality()).append("\n");
        if (student.getSpeakingStyle() != null && !student.getSpeakingStyle().isBlank()) {
            sb.append("Speaking Style: ").append(student.getSpeakingStyle()).append("\n");
        }
        sb.append("\n");

        if (allParticipants != null && !allParticipants.isEmpty()) {
            sb.append("Your classmates sitting next to you are:\n");
            for (com.studentai.project.session.SessionParticipant p : allParticipants) {
                if (p.getStudent() != null && !p.getStudent().getId().equals(student.getId())) {
                    sb.append("- ").append(p.getStudent().getName()).append(": ")
                            .append(p.getStudent().getPersonality()).append("\n");
                }
            }
            sb.append("\n");
        }

        sb.append("=== CONVERSATIONAL & CHARACTER RULES ===\n");
        sb.append("1. Respond directly to what the teacher actually said or asked.\n");
        sb.append("2. GREETINGS & CASUAL TALK: If the teacher greets you (e.g., 'Hi', 'Good morning', 'How are you?'), respond naturally and politely to the greeting as an 8th grader. Do NOT force the conversation into the science lesson unless asked.\n");
        sb.append("3. UNRELATED QUESTIONS: If the teacher asks a casual, personal, or unrelated question (e.g., about your weekend, sports, lunch, hobbies, fun facts), answer it normally as a middle school student from your personality without mentioning the science scenario, Anthony, or the cold virus.\n");
        sb.append("4. MIXED QUESTIONS: If the teacher combines a greeting with a science question (e.g., 'Hi Sue, what do you think made Anthony sick?'), briefly greet them and address the science question.\n");
        sb.append("5. PEER INDEPENDENCE: You hear what other students say, but you think independently. Test what your classmates say against your own beliefs and understanding rather than just copying them.\n");
        sb.append("6. ROLE: You are a real middle school student sitting in a classroom talking to your teacher and classmates. You are NOT an AI. NEVER break character, and never lecture or explain the full lesson back to the teacher.\n");
        sb.append("7. LENGTH & MANNERISMS: Keep your replies natural, spoken, and between 1 to 3 sentences. Express hesitation or enthusiasm naturally as fits your personality and speaking style. Do NOT start every sentence with 'Um'.\n\n");

        if (referencedPeerName != null && !referencedPeerName.isBlank()) {
            sb.append("=== PEER DISCUSSION FOCUS ===\n");
            sb.append("The teacher specifically asked you about what ").append(referencedPeerName).append(" said.\n");
            sb.append("Directly react or respond to ").append(referencedPeerName).append("'s comments using your own perspective and current mental state.\n\n");
        }

        // 2. Scenario Background
        sb.append("=== CLASSROOM SCENARIO BACKGROUND ===\n");
        sb.append("Scenario Title: ").append(scenario.getTitle()).append("\n");
        sb.append("Story: ").append(scenario.getDescription()).append("\n\n");

        // 3. Misconception / Mental Model
        if (mentalModel != null) {
            sb.append("=== YOUR BELIEFS & MISCONCEPTION (WHEN DISCUSSING THE SCIENCE LESSON) ===\n");
            sb.append("What you believe about the illness: ").append(mentalModel.getWrongBelief()).append("\n");
            sb.append("Why it makes sense to you: ").append(mentalModel.getWhyItFeelsRight()).append("\n");
            if (mentalModel.getDefenses() != null && !mentalModel.getDefenses().isEmpty()) {
                sb.append("Arguments you use when challenged on your science theory:\n");
                for (String defense : mentalModel.getDefenses()) {
                    sb.append("- \"").append(defense).append("\"\n");
                }
            }
            sb.append("\n");
        }

        // 4. Current State Constraints
        sb.append("=== YOUR ACADEMIC MENTAL STATE: [").append(currentState.name()).append("] (WHEN DISCUSSING THE LESSON) ===\n");
        sb.append("You have spent ").append(turnsInState).append(" academic turn(s) in this state.\n");
        sb.append(getStateInstructions(currentState, turnsInState)).append("\n\n");

        if (stateSummary != null && !stateSummary.isBlank()) {
            sb.append("=== ACADEMIC PROGRESS SUMMARY SO FAR ===\n");
            sb.append(stateSummary).append("\n\n");
        }

        sb.append("Respond directly as ").append(student.getName()).append(". Do NOT prefix your response with your name or any label.");
        return sb.toString();
    }

    public String buildConversationHistory(List<Message> recentMessages) {
        return buildConversationHistory(recentMessages, "Student");
    }

    public String buildConversationHistory(List<Message> recentMessages, String studentName) {
        if (recentMessages == null || recentMessages.isEmpty()) {
            return "No prior messages. This is the start of the discussion.";
        }

        StringBuilder sb = new StringBuilder();
        int startIndex = Math.max(0, recentMessages.size() - 8);

        for (int i = startIndex; i < recentMessages.size(); i++) {
            Message msg = recentMessages.get(i);
            String speaker;
            if (msg.getSenderType() == SenderType.TEACHER) {
                speaker = "Teacher";
            } else if (msg.getStudent() != null && msg.getStudent().getName() != null) {
                speaker = msg.getStudent().getName();
            } else {
                speaker = (studentName != null && !studentName.isBlank()) ? studentName : "Student";
            }
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
