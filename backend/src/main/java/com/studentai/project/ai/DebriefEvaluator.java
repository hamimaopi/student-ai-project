package com.studentai.project.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.message.Message;
import com.studentai.project.message.SenderType;
import com.studentai.project.session.SessionParticipant;
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

    /**
     * Multi-student debrief generation evaluating group facilitation, individual trajectories,
     * and attention equity across all participants.
     */
    public DebriefData generateDebrief(
            String scenarioTitle,
            String scenarioDescription,
            List<SessionParticipant> participants,
            List<Message> messages
    ) {
        if (participants == null || participants.isEmpty()) {
            return buildMultiStudentFallbackDebrief(Collections.emptyList(), messages, Collections.emptyMap(), false);
        }

        // If only 1 participant, fallback or delegate cleanly
        if (participants.size() == 1) {
            SessionParticipant p = participants.get(0);
            String sName = p.getStudent() != null ? p.getStudent().getName() : "Student";
            String wrongBelief = p.getMentalModel() != null ? p.getMentalModel().getWrongBelief() : "Believes tiredness caused cold.";
            return generateDebrief(scenarioTitle, scenarioDescription, sName, wrongBelief, p.getCurrentState(), messages);
        }

        int totalTurns = messages.size();
        boolean masteryAchieved = participants.stream().anyMatch(p -> p.getCurrentState() == StudentState.UNDERSTANDING);
        Map<String, Integer> equityBreakdown = computeEquityBreakdown(participants, messages);

        if (messages.isEmpty()) {
            return buildMultiStudentFallbackDebrief(participants, messages, equityBreakdown, masteryAchieved);
        }

        StringBuilder rosterSb = new StringBuilder();
        for (SessionParticipant p : participants) {
            if (p.getStudent() == null) continue;
            String name = p.getStudent().getName();
            StudentState init = p.getMentalModel() != null && p.getMentalModel().getInitialState() != null
                    ? p.getMentalModel().getInitialState()
                    : StudentState.CONFIDENTLY_WRONG;
            String wrongBelief = p.getMentalModel() != null ? p.getMentalModel().getWrongBelief() : "Misconception about disease transmission";
            rosterSb.append(String.format("- %s (%s): Initial State=%s, Final State=%s, Misconception: \"%s\", Turns Spoken: %d\n",
                    name, p.getStudent().getPersonality(), init.name(), p.getCurrentState().name(), wrongBelief, p.getTurnsSpoken()));
        }

        StringBuilder transcriptSb = new StringBuilder();
        for (Message m : messages) {
            String speaker;
            if (m.getSenderType() == SenderType.TEACHER) {
                String target = m.getTargetStudent() != null ? " (to " + m.getTargetStudent().getName() + ")" : "";
                speaker = "Teacher" + target;
            } else {
                String name = m.getStudent() != null ? m.getStudent().getName() : "Student";
                String state = m.getStudentStateSnapshot() != null ? " [" + m.getStudentStateSnapshot().name() + "]" : "";
                speaker = name + state;
            }
            transcriptSb.append(String.format("[Turn %d] %s: %s\n", m.getTurnNumber(), speaker, m.getContent()));
        }

        String systemPrompt = """
            You are an expert pedagogical coach evaluating a middle school science teacher's whole-class facilitation.
            The teacher engaged multiple students in inquiry regarding disease transmission and incubation periods.

            Analyze the classroom transcript and return ONLY a valid JSON object matching this schema:
            {
              "summary": "2-3 sentences assessing how the teacher orchestrated group discourse and helped students overcome their misconceptions.",
              "breakthroughMoment": "A key class turning point or collective breakthrough in the dialogue.",
              "classroomManagementAdvice": "Actionable feedback on participation equity, balancing eager students vs quieter students, and peer-to-peer discourse facilitation.",
              "strategyBreakdown": {
                "PROBING": 45,
                "GUIDED_DISCOVERY": 40,
                "TELLING": 15
              },
              "strengths": [
                "First strength observed in whole-class orchestration",
                "Second strength observed"
              ],
              "growthOpportunities": [
                "Actionable tip on how the teacher could facilitate even deeper group reasoning"
              ],
              "studentOutcomes": {
                "<StudentName>": {
                  "breakthroughMoment": "Specific shift or insight achieved by this student in the discussion.",
                  "masteryAchieved": true
                }
              }
            }

            Rules:
            1. strategyBreakdown percentages must be integers summing to 100 representing PROBING, GUIDED_DISCOVERY, and TELLING.
            2. studentOutcomes MUST include an entry for every student in the roster.
            3. Be encouraging, specific, and grounded in the transcript.
            4. Output ONLY the JSON block. Do not include markdown code fences or commentary outside the JSON.
            """;

        String userPrompt = String.format("""
            SCENARIO: %s - %s

            STUDENT ROSTER:
            %s

            EQUITY DISTRIBUTION (Actual student turns percentage):
            %s

            TRANSCRIPT:
            %s
            """,
                scenarioTitle,
                scenarioDescription,
                rosterSb,
                equityBreakdown,
                transcriptSb
        );

        try {
            Prompt prompt = new Prompt(List.of(
                    new SystemMessage(systemPrompt),
                    new UserMessage(userPrompt)
            ));

            String rawJson = chatModel.call(prompt).getResult().getOutput().getText();
            return parseMultiStudentDebriefResponse(rawJson, participants, messages, equityBreakdown, masteryAchieved);
        } catch (Exception e) {
            log.warn("Failed to generate AI multi-student debrief via LLM, applying fallback: {}", e.getMessage());
            return buildMultiStudentFallbackDebrief(participants, messages, equityBreakdown, masteryAchieved);
        }
    }

    /**
     * Single-student debrief generator preserved for backwards compatibility.
     */
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

    public DebriefData parseMultiStudentDebriefResponse(
            String rawJson,
            List<SessionParticipant> participants,
            List<Message> messages,
            Map<String, Integer> equityBreakdown,
            boolean masteryAchieved
    ) {
        if (rawJson == null || rawJson.isBlank()) {
            return buildMultiStudentFallbackDebrief(participants, messages, equityBreakdown, masteryAchieved);
        }

        try {
            String extracted = rawJson.trim();
            Matcher matcher = JSON_BLOCK_PATTERN.matcher(extracted);
            if (matcher.find()) {
                extracted = matcher.group(0);
            }

            JsonNode node = objectMapper.readTree(extracted);

            String summary = node.path("summary").asText(
                    "The teacher guided the classroom through scientific inquiry into disease transmission."
            );

            String breakthroughMoment = node.path("breakthroughMoment").asText(
                    masteryAchieved
                            ? "The class recognized that cold viruses require transmission from a pathogen host and an incubation period, rather than fatigue alone."
                            : "Students actively began questioning whether physical tiredness alone could produce viral illnesses."
            );

            String classroomManagementAdvice = node.path("classroomManagementAdvice").asText(
                    generateEquityAdvice(equityBreakdown)
            );

            Map<String, Integer> strategyBreakdown = new LinkedHashMap<>();
            JsonNode breakdownNode = node.path("strategyBreakdown");
            if (breakdownNode.isObject()) {
                breakdownNode.fields().forEachRemaining(entry -> {
                    strategyBreakdown.put(entry.getKey(), entry.getValue().asInt(0));
                });
            }
            if (strategyBreakdown.isEmpty()) {
                strategyBreakdown.put("PROBING", 45);
                strategyBreakdown.put("GUIDED_DISCOVERY", 40);
                strategyBreakdown.put("TELLING", 15);
            }

            List<String> strengths = new ArrayList<>();
            JsonNode strengthsNode = node.path("strengths");
            if (strengthsNode.isArray()) {
                strengthsNode.forEach(s -> strengths.add(s.asText()));
            }
            if (strengths.isEmpty()) {
                strengths.add("Facilitated open inquiry allowing diverse student reasoning to emerge.");
                strengths.add("Encouraged comparison of hypotheses rather than premature evaluation.");
            }

            List<String> growthOpportunities = new ArrayList<>();
            JsonNode growthNode = node.path("growthOpportunities");
            if (growthNode.isArray()) {
                growthNode.forEach(g -> growthOpportunities.add(g.asText()));
            }
            if (growthOpportunities.isEmpty()) {
                growthOpportunities.add("Prompt students to directly respond to peer hypotheses to foster deeper inter-student argumentation.");
            }

            // Parse student outcomes
            Map<String, DebriefData.StudentOutcome> outcomes = new LinkedHashMap<>();
            JsonNode outcomesNode = node.path("studentOutcomes");

            for (SessionParticipant p : participants) {
                if (p.getStudent() == null) continue;
                String name = p.getStudent().getName();
                StudentState init = p.getMentalModel() != null && p.getMentalModel().getInitialState() != null
                        ? p.getMentalModel().getInitialState()
                        : StudentState.CONFIDENTLY_WRONG;
                StudentState fin = p.getCurrentState();
                boolean studentMastery = fin == StudentState.UNDERSTANDING;

                JsonNode studentNode = outcomesNode.path(name);
                String breakthrough = studentNode.path("breakthroughMoment").asText("");
                if (breakthrough.isBlank()) {
                    breakthrough = studentMastery
                            ? String.format("%s recognized viral pathogens and incubation periods as the true cause of the cold.", name)
                            : (fin == StudentState.CONFUSED || fin == StudentState.TENTATIVELY_CORRECT
                            ? String.format("%s began questioning whether basketball tiredness alone could generate viruses.", name)
                            : String.format("%s actively engaged in the discussion and evaluated peer perspectives.", name));
                }

                outcomes.put(name, DebriefData.StudentOutcome.builder()
                        .studentName(name)
                        .initialState(init)
                        .finalState(fin)
                        .turnsSpoken(p.getTurnsSpoken())
                        .breakthroughMoment(breakthrough)
                        .masteryAchieved(studentMastery)
                        .build());
            }

            StudentState primaryFinalState = participants.isEmpty() ? StudentState.CONFIDENTLY_WRONG : participants.get(0).getCurrentState();

            return DebriefData.builder()
                    .masteryAchieved(masteryAchieved)
                    .finalStudentState(primaryFinalState)
                    .totalTurns(messages.size())
                    .summary(summary)
                    .breakthroughMoment(breakthroughMoment)
                    .classroomManagementAdvice(classroomManagementAdvice)
                    .strategyBreakdown(strategyBreakdown)
                    .equityBreakdown(equityBreakdown)
                    .studentOutcomes(outcomes)
                    .strengths(strengths)
                    .growthOpportunities(growthOpportunities)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse multi-student debrief JSON: '{}', using fallback. Error: {}", rawJson, e.getMessage());
            return buildMultiStudentFallbackDebrief(participants, messages, equityBreakdown, masteryAchieved);
        }
    }

    public DebriefData parseDebriefResponse(String rawJson, StudentState finalState, int totalTurns, String studentName, boolean masteryAchieved) {
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

            Map<String, DebriefData.StudentOutcome> outcomes = new LinkedHashMap<>();
            outcomes.put(studentName, DebriefData.StudentOutcome.builder()
                    .studentName(studentName)
                    .initialState(StudentState.CONFIDENTLY_WRONG)
                    .finalState(finalState)
                    .turnsSpoken(totalTurns)
                    .breakthroughMoment(breakthroughMoment)
                    .masteryAchieved(masteryAchieved)
                    .build());

            Map<String, Integer> equity = new LinkedHashMap<>();
            equity.put(studentName, 100);

            return DebriefData.builder()
                    .masteryAchieved(masteryAchieved)
                    .finalStudentState(finalState)
                    .totalTurns(totalTurns)
                    .summary(summary)
                    .breakthroughMoment(breakthroughMoment)
                    .classroomManagementAdvice("One-on-one instructional session.")
                    .strategyBreakdown(strategyBreakdown)
                    .equityBreakdown(equity)
                    .studentOutcomes(outcomes)
                    .strengths(strengths)
                    .growthOpportunities(growthOpportunities)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse debrief JSON: '{}', using fallback. Error: {}", rawJson, e.getMessage());
            return buildFallbackDebrief(finalState, totalTurns, studentName, masteryAchieved);
        }
    }

    public DebriefData buildMultiStudentFallbackDebrief(
            List<SessionParticipant> participants,
            List<Message> messages,
            Map<String, Integer> equityBreakdown,
            boolean masteryAchieved
    ) {
        int totalTurns = messages != null ? messages.size() : 0;
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("PROBING", 50);
        breakdown.put("GUIDED_DISCOVERY", 35);
        breakdown.put("TELLING", 15);

        Map<String, DebriefData.StudentOutcome> outcomes = new LinkedHashMap<>();
        for (SessionParticipant p : participants) {
            if (p.getStudent() == null) continue;
            String name = p.getStudent().getName();
            StudentState init = p.getMentalModel() != null && p.getMentalModel().getInitialState() != null
                    ? p.getMentalModel().getInitialState()
                    : StudentState.CONFIDENTLY_WRONG;
            StudentState fin = p.getCurrentState();
            boolean studentMastery = fin == StudentState.UNDERSTANDING;
            String breakthrough = studentMastery
                    ? String.format("%s connected Anthony's exposure to Sam's cold with the multi-day incubation period.", name)
                    : (fin == StudentState.CONFUSED || fin == StudentState.TENTATIVELY_CORRECT
                    ? String.format("%s began questioning whether basketball tiredness could generate viruses on its own.", name)
                    : String.format("%s actively engaged in the discussion and began considering peer hypotheses.", name));

            outcomes.put(name, DebriefData.StudentOutcome.builder()
                    .studentName(name)
                    .initialState(init)
                    .finalState(fin)
                    .turnsSpoken(p.getTurnsSpoken())
                    .breakthroughMoment(breakthrough)
                    .masteryAchieved(studentMastery)
                    .build());
        }

        String summary = masteryAchieved
                ? "Excellent classroom orchestration! You guided the class to deconstruct the correlation vs. causation fallacy regarding the basketball game and understand viral incubation."
                : "A productive scientific discussion. The students made noticeable progress challenging their initial misconceptions and evaluating how illnesses spread.";

        String breakthrough = masteryAchieved
                ? "The class reached a shared realization that exposure days earlier to Sam was the true cause of Anthony's illness."
                : "The students began distinguishing between feeling tired and catching a biological virus.";

        String advice = generateEquityAdvice(equityBreakdown);
        StudentState primaryFinalState = participants.isEmpty() ? StudentState.CONFIDENTLY_WRONG : participants.get(0).getCurrentState();

        return DebriefData.builder()
                .masteryAchieved(masteryAchieved)
                .finalStudentState(primaryFinalState)
                .totalTurns(totalTurns)
                .summary(summary)
                .breakthroughMoment(breakthrough)
                .classroomManagementAdvice(advice)
                .strategyBreakdown(breakdown)
                .equityBreakdown(equityBreakdown)
                .studentOutcomes(outcomes)
                .strengths(List.of(
                        "Orchestrated dialogue across multiple students with differing baseline conceptions.",
                        "Encouraged peer comparison of ideas rather than immediately confirming or denying responses.",
                        "Maintained an open, collaborative classroom inquiry culture."
                ))
                .growthOpportunities(List.of(
                        "Prompt students to directly respond to each other's ideas ('Lena, what do you think of Marcus's hypothesis?').",
                        "Explicitly highlight the timeline delay (incubation period) before drawing final conclusions."
                ))
                .build();
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

        Map<String, DebriefData.StudentOutcome> outcomes = new LinkedHashMap<>();
        outcomes.put(studentName, DebriefData.StudentOutcome.builder()
                .studentName(studentName)
                .initialState(StudentState.CONFIDENTLY_WRONG)
                .finalState(finalState)
                .turnsSpoken(totalTurns)
                .breakthroughMoment(breakthrough)
                .masteryAchieved(masteryAchieved)
                .build());

        Map<String, Integer> equity = new LinkedHashMap<>();
        equity.put(studentName, 100);

        return DebriefData.builder()
                .masteryAchieved(masteryAchieved)
                .finalStudentState(finalState)
                .totalTurns(totalTurns)
                .summary(summary)
                .breakthroughMoment(breakthrough)
                .classroomManagementAdvice("One-on-one instructional session.")
                .strategyBreakdown(breakdown)
                .equityBreakdown(equity)
                .studentOutcomes(outcomes)
                .strengths(List.of(
                        "Used diagnostic questioning to elicit student thinking.",
                        "Maintained patient, encouraging tone throughout the discussion."
                ))
                .growthOpportunities(List.of(
                        "Highlight the time delay between exposure and symptoms (incubation period) earlier in the dialogue."
                ))
                .build();
    }

    public Map<String, Integer> computeEquityBreakdown(List<SessionParticipant> participants, List<Message> messages) {
        Map<String, Integer> turnsPerStudent = new LinkedHashMap<>();
        for (SessionParticipant p : participants) {
            if (p.getStudent() != null) {
                turnsPerStudent.put(p.getStudent().getName(), 0);
            }
        }
        for (Message m : messages) {
            if (m.getSenderType() == SenderType.STUDENT && m.getStudent() != null) {
                String name = m.getStudent().getName();
                turnsPerStudent.put(name, turnsPerStudent.getOrDefault(name, 0) + 1);
            }
        }
        int totalStudentTurns = turnsPerStudent.values().stream().mapToInt(Integer::intValue).sum();
        Map<String, Integer> equityBreakdown = new LinkedHashMap<>();
        if (totalStudentTurns > 0) {
            for (Map.Entry<String, Integer> entry : turnsPerStudent.entrySet()) {
                int pct = Math.round((entry.getValue() * 100.0f) / totalStudentTurns);
                equityBreakdown.put(entry.getKey(), pct);
            }
        } else {
            for (SessionParticipant p : participants) {
                if (p.getStudent() != null) {
                    int weight = p.getStudent().getParticipationWeight() != null ? p.getStudent().getParticipationWeight() : 33;
                    equityBreakdown.put(p.getStudent().getName(), weight);
                }
            }
        }
        return equityBreakdown;
    }

    public String generateEquityAdvice(Map<String, Integer> equityBreakdown) {
        if (equityBreakdown == null || equityBreakdown.isEmpty()) {
            return "Encourage balanced contributions by calling on diverse voices and prompting peer-to-peer reactions.";
        }
        Integer marcusPct = equityBreakdown.getOrDefault("Marcus", 0);
        Integer lenaPct = equityBreakdown.getOrDefault("Lena", 0);
        Integer suePct = equityBreakdown.getOrDefault("Sue", 0);

        if (lenaPct < 15) {
            return "Lena was quiet this session (" + lenaPct + "% of student turns). In future discussions, try inviting Lena early to share an observation before Marcus or Sue solidify the group direction.";
        } else if (marcusPct > 60) {
            return "Marcus dominated the discussion (" + marcusPct + "% of turns). You can gently channel his enthusiasm by asking him to critique or build on ideas from Lena and Sue.";
        } else if (Math.abs(marcusPct - 40) <= 15 && Math.abs(lenaPct - 20) <= 15 && Math.abs(suePct - 40) <= 15) {
            return "Commendable attention equity! Participation closely mirrored target engagement weights, fostering a multi-perspective inquiry dialogue.";
        } else {
            return "Good facilitation! Continue prompting students to respond directly to peer assertions to create a cohesive classroom discourse culture.";
        }
    }
}
