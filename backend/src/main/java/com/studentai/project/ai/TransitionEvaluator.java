package com.studentai.project.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.statemachine.TeacherStrategy;
import com.studentai.project.statemachine.TransitionRecommendation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransitionEvaluator {

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("\\{.*\\}", Pattern.DOTALL);

    private final ChatModel chatModel;
    private final ObjectMapper objectMapper;

    public TeacherMoveEvaluation evaluate(
            String scenarioDescription,
            String wrongBelief,
            StudentState currentState,
            String teacherMessage
    ) {
        String systemInstructions = """
            You are an expert pedagogical evaluator analyzing a teaching interaction.
            A real student (acting as Teacher) is speaking to an AI student who holds a misconception.

            Evaluate the Teacher's latest message and return ONLY a valid JSON object matching this schema:
            {
              "strategy": "TELLING" | "PROBING" | "CONTRADICTION" | "GUIDED_DISCOVERY" | "CONFIRMATION" | "OFF_TOPIC",
              "addressesMisconception": true | false,
              "clarity": "CLEAR_WITH_REASONING" | "PROCEDURAL_ONLY" | "UNCLEAR",
              "recommendation": "ADVANCE" | "STAY" | "REGRESS",
              "turnSummary": "A concise 1-sentence summary of what the teacher did and its likely pedagogical effect."
            }

            Definitions:
            - TELLING: Teacher simply states facts or declares the student is wrong without asking questions or exploring reasons.
            - PROBING: Teacher asks open or diagnostic questions to understand what the student thinks.
            - CONTRADICTION: Teacher highlights a contradiction or counterexample in the student's belief.
            - GUIDED_DISCOVERY: Teacher leads the student step-by-step to discover the mechanism themselves.
            - CONFIRMATION: Teacher affirms the student's correct reasoning.
            - OFF_TOPIC: Unrelated chit-chat or irrelevant statements.

            Recommendation Rules:
            - ADVANCE: If the teacher asked a thoughtful question that challenges the misconception or provided clear reasoning that resolves confusion.
            - STAY: If the teacher repeated themselves, gave partial answers, or made a weak probe.
            - REGRESS: If the teacher gave contradictory, confusing, or misleading explanations.

            Do NOT include markdown formatting or explanations outside the JSON object.
            """;

        String userPrompt = String.format("""
            SCENARIO: %s
            STUDENT'S WRONG BELIEF: %s
            STUDENT'S CURRENT STATE: %s
            TEACHER'S LATEST MESSAGE: "%s"
            """,
                scenarioDescription,
                wrongBelief,
                currentState.name(),
                teacherMessage
        );

        try {
            Prompt prompt = new Prompt(List.of(
                    new SystemMessage(systemInstructions),
                    new UserMessage(userPrompt)
            ));

            String rawResponse = chatModel.call(prompt).getResult().getOutput().getText();
            return parseEvaluation(rawResponse, teacherMessage);
        } catch (Exception e) {
            log.warn("Failed to evaluate teacher move via LLM, applying heuristic fallback: {}", e.getMessage());
            return fallbackEvaluation(teacherMessage);
        }
    }

    TeacherMoveEvaluation parseEvaluation(String rawJson, String teacherMessage) {
        if (rawJson == null || rawJson.isBlank()) {
            return fallbackEvaluation(teacherMessage);
        }

        try {
            String extracted = rawJson.trim();
            Matcher matcher = JSON_BLOCK_PATTERN.matcher(extracted);
            if (matcher.find()) {
                extracted = matcher.group(0);
            }

            JsonNode node = objectMapper.readTree(extracted);

            TeacherStrategy strategy = parseStrategy(node.path("strategy").asText());
            boolean addressesMisconception = node.path("addressesMisconception").asBoolean(true);
            String clarity = node.path("clarity").asText("CLEAR_WITH_REASONING");
            TransitionRecommendation recommendation = parseRecommendation(node.path("recommendation").asText());
            String turnSummary = node.path("turnSummary").asText("Teacher responded to student's reasoning.");

            return TeacherMoveEvaluation.builder()
                    .strategy(strategy)
                    .addressesMisconception(addressesMisconception)
                    .clarity(clarity)
                    .recommendation(recommendation)
                    .turnSummary(turnSummary)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse evaluator JSON response: '{}', falling back. Error: {}", rawJson, e.getMessage());
            return fallbackEvaluation(teacherMessage);
        }
    }

    private TeacherStrategy parseStrategy(String raw) {
        if (raw == null) return TeacherStrategy.PROBING;
        try {
            return TeacherStrategy.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return TeacherStrategy.PROBING;
        }
    }

    private TransitionRecommendation parseRecommendation(String raw) {
        if (raw == null) return TransitionRecommendation.STAY;
        try {
            return TransitionRecommendation.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return TransitionRecommendation.STAY;
        }
    }

    private TeacherMoveEvaluation fallbackEvaluation(String teacherMessage) {
        boolean isQuestion = teacherMessage != null && teacherMessage.trim().endsWith("?");
        TeacherStrategy strategy = isQuestion ? TeacherStrategy.PROBING : TeacherStrategy.TELLING;
        TransitionRecommendation rec = isQuestion ? TransitionRecommendation.ADVANCE : TransitionRecommendation.STAY;

        return TeacherMoveEvaluation.builder()
                .strategy(strategy)
                .addressesMisconception(true)
                .clarity("PROCEDURAL_ONLY")
                .recommendation(rec)
                .turnSummary(isQuestion ? "Teacher asked a question." : "Teacher made a statement.")
                .build();
    }
}
