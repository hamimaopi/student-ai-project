package com.studentai.project.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.message.Message;
import com.studentai.project.message.SenderType;
import com.studentai.project.statemachine.StudentState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class DebriefEvaluator {

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("\\{.*\\}", Pattern.DOTALL);

    private final ChatModel chatModel;
    private final ObjectMapper objectMapper;

    public DebriefData generateDebrief(
            String scenarioTitle,
            String scenarioDescription,
            String studentName,
            String wrongBelief,
            StudentState finalState,
            List<Message> messages
    ) {
        int totalTurns = messages.size();
        boolean masteryAchieved = finalState == StudentState.UNDERSTANDING;

        if (messages.isEmpty()) {
            return buildFallbackDebrief(finalState, totalTurns, studentName, masteryAchieved);
        }

        StringBuilder transcriptSb = new StringBuilder();
        for (Message m : messages) {
            String speaker = m.getSenderType() == SenderType.TEACHER ? "Teacher" : studentName;
            transcriptSb.append(String.format("[Turn %d] %s: %s\n", m.getTurnNumber(), speaker, m.getContent()));
        }

        String systemPrompt = """
            You are an expert pedagogical coach evaluating a teacher's performance during a science lesson.
            A teacher worked with a middle school student who held a misconception about disease transmission and causation.

            Analyze the conversation transcript and return ONLY a valid JSON object matching this schema:
            {
              "summary": "2-3 sentences assessing how the teacher helped the student unpack and overcome their misconception.",
              "breakthroughMoment": "A specific turn or turning point where the student shifted away from their misconception.",
              "strategyBreakdown": {
                "PROBING": 40,
                "GUIDED_DISCOVERY": 40,
                "TELLING": 20
              },
              "strengths": [
                "First strength observed in the teacher's moves",
                "Second strength observed"
              ],
              "growthOpportunities": [
                "Actionable tip on how the teacher could facilitate even deeper reasoning"
              ]
            }

            Rules:
            1. strategyBreakdown percentages must be integers summing to 100 representing Probing, Guided Discovery, and Telling.
            2. Be encouraging, specific, and grounded in the transcript.
            3. Output ONLY the JSON block. Do not include markdown code fences or explanations outside the JSON.
            """;

        String userPrompt = String.format("""
            SCENARIO: %s - %s
            STUDENT: %s
            INITIAL MISCONCEPTION: %s
            FINAL STUDENT STATE: %s

            TRANSCRIPT:
            %s
            """,
                scenarioTitle,
                scenarioDescription,
                studentName,
                wrongBelief,
                finalState.name(),
                transcriptSb
        );

        try {
            Prompt prompt = new Prompt(List.of(
                    new SystemMessage(systemPrompt),
                    new UserMessage(userPrompt)
            ));

            String rawJson = chatModel.call(prompt).getResult().getOutput().getText();
            return parseDebriefResponse(rawJson, finalState, totalTurns, studentName, masteryAchieved);
        } catch (Exception e) {
            log.warn("Failed to generate AI debrief via LLM, applying fallback: {}", e.getMessage());
            return buildFallbackDebrief(finalState, totalTurns, studentName, masteryAchieved);
        }
    }

    DebriefData parseDebriefResponse(String rawJson, StudentState finalState, int totalTurns, String studentName, boolean masteryAchieved) {
        if (rawJson == null || rawJson.isBlank()) {
            return buildFallbackDebrief(finalState, totalTurns, studentName, masteryAchieved);
        }

        try {
            String extracted = rawJson.trim();
            Matcher matcher = JSON_BLOCK_PATTERN.matcher(extracted);
            if (matcher.find()) {
                extracted = matcher.group(0);
            }

            JsonNode node = objectMapper.readTree(extracted);

            String summary = node.path("summary").asText(
                    String.format("The teacher guided %s through scientific reasoning regarding disease transmission.", studentName)
            );

            String breakthroughMoment = node.path("breakthroughMoment").asText(
                    masteryAchieved
                            ? String.format("%s recognized that cold viruses come from pathogens and incubation periods, not physical tiredness.", studentName)
                            : String.format("%s began questioning whether basketball tiredness could generate viruses on its own.", studentName)
            );

            Map<String, Integer> strategyBreakdown = new LinkedHashMap<>();
            JsonNode breakdownNode = node.path("strategyBreakdown");
            if (breakdownNode.isObject()) {
                breakdownNode.fields().forEachRemaining(entry -> {
                    strategyBreakdown.put(entry.getKey(), entry.getValue().asInt(0));
                });
            }
            if (strategyBreakdown.isEmpty()) {
                strategyBreakdown.put("PROBING", 50);
                strategyBreakdown.put("GUIDED_DISCOVERY", 35);
                strategyBreakdown.put("TELLING", 15);
            }

            List<String> strengths = new ArrayList<>();
            JsonNode strengthsNode = node.path("strengths");
            if (strengthsNode.isArray()) {
                strengthsNode.forEach(s -> strengths.add(s.asText()));
            }
            if (strengths.isEmpty()) {
                strengths.add("Asked open-ended questions that prompted genuine reflection.");
                strengths.add(String.format("Allowed %s to express doubt without immediate judgment.", studentName));
            }

            List<String> growthOpportunities = new ArrayList<>();
            JsonNode growthNode = node.path("growthOpportunities");
            if (growthNode.isArray()) {
                growthNode.forEach(g -> growthOpportunities.add(g.asText()));
            }
            if (growthOpportunities.isEmpty()) {
                growthOpportunities.add("Connect student observations to mechanism before introducing technical terminology.");
            }

            return DebriefData.builder()
                    .masteryAchieved(masteryAchieved)
                    .finalStudentState(finalState)
                    .totalTurns(totalTurns)
                    .summary(summary)
                    .breakthroughMoment(breakthroughMoment)
                    .strategyBreakdown(strategyBreakdown)
                    .strengths(strengths)
                    .growthOpportunities(growthOpportunities)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse debrief JSON: '{}', using fallback. Error: {}", rawJson, e.getMessage());
            return buildFallbackDebrief(finalState, totalTurns, studentName, masteryAchieved);
        }
    }

    private DebriefData buildFallbackDebrief(StudentState finalState, int totalTurns, String studentName, boolean masteryAchieved) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("PROBING", 55);
        breakdown.put("GUIDED_DISCOVERY", 30);
        breakdown.put("TELLING", 15);

        String summary = masteryAchieved
                ? String.format("Outstanding teaching! You helped %s unpack the difference between correlation (game tiredness) and cause (viral transmission from Sam).", studentName)
                : String.format("A valuable learning session. %s made progress questioning her initial beliefs about the basketball game.", studentName);

        String breakthrough = masteryAchieved
                ? String.format("%s realized Anthony's cold came from working closely with Sam days earlier.", studentName)
                : String.format("%s began considering why Sam had the cold first before Anthony.", studentName);

        return DebriefData.builder()
                .masteryAchieved(masteryAchieved)
                .finalStudentState(finalState)
                .totalTurns(totalTurns)
                .summary(summary)
                .breakthroughMoment(breakthrough)
                .strategyBreakdown(breakdown)
                .strengths(List.of(
                        "Used diagnostic questioning to elicit student thinking.",
                        "Maintained patient, encouraging tone throughout the discussion."
                ))
                .growthOpportunities(List.of(
                        "Highlight the time delay between exposure and symptoms (incubation period) earlier in the dialogue."
                ))
                .build();
    }
}
