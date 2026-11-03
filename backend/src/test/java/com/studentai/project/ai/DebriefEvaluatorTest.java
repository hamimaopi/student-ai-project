package com.studentai.project.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.statemachine.StudentState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class DebriefEvaluatorTest {

    @Mock
    private ChatModel chatModel;

    private DebriefEvaluator evaluator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        evaluator = new DebriefEvaluator(chatModel, objectMapper);
    }

    @Test
    @DisplayName("Parse valid AI debrief response JSON")
    void testParseValidDebriefJson() {
        String json = """
            {
              "summary": "Great guided discovery dialogue that challenged Sue's misconception.",
              "breakthroughMoment": "Turn 4: Sue realized viruses take days to show symptoms.",
              "strategyBreakdown": {
                "PROBING": 50,
                "GUIDED_DISCOVERY": 35,
                "TELLING": 15
              },
              "strengths": [
                "Asked open questions instead of declaring the student wrong.",
                "Kept Sue engaged in reasoning."
              ],
              "growthOpportunities": [
                "Consider asking where germs come from earlier in the discussion."
              ]
            }
            """;

        DebriefData debrief = evaluator.parseDebriefResponse(json, StudentState.UNDERSTANDING, 6, "Sue", true);

        assertNotNull(debrief);
        assertTrue(debrief.isMasteryAchieved());
        assertEquals(StudentState.UNDERSTANDING, debrief.getFinalStudentState());
        assertEquals(6, debrief.getTotalTurns());
        assertEquals("Great guided discovery dialogue that challenged Sue's misconception.", debrief.getSummary());
        assertEquals("Turn 4: Sue realized viruses take days to show symptoms.", debrief.getBreakthroughMoment());
        assertEquals(50, debrief.getStrategyBreakdown().get("PROBING"));
        assertEquals(2, debrief.getStrengths().size());
        assertEquals(1, debrief.getGrowthOpportunities().size());
    }

    @Test
    @DisplayName("Fallback debrief is generated gracefully on malformed JSON")
    void testFallbackOnMalformedJson() {
        DebriefData debrief = evaluator.parseDebriefResponse("Not valid json at all", StudentState.CONFUSED, 4, "Sue", false);

        assertNotNull(debrief);
        assertFalse(debrief.isMasteryAchieved());
        assertEquals(StudentState.CONFUSED, debrief.getFinalStudentState());
        assertEquals(4, debrief.getTotalTurns());
        assertNotNull(debrief.getStrategyBreakdown());
        assertFalse(debrief.getStrengths().isEmpty());
    }
}
