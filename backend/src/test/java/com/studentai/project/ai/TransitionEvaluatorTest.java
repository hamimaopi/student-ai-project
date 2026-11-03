package com.studentai.project.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.statemachine.TeacherStrategy;
import com.studentai.project.statemachine.TransitionRecommendation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransitionEvaluatorTest {

    @Mock
    private ChatModel chatModel;

    private TransitionEvaluator evaluator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        evaluator = new TransitionEvaluator(chatModel, objectMapper);
    }

    @Test
    @DisplayName("Parse valid raw JSON evaluation")
    void testParseValidJson() {
        String json = """
            {
              "strategy": "PROBING",
              "addressesMisconception": true,
              "clarity": "CLEAR_WITH_REASONING",
              "recommendation": "ADVANCE",
              "turnSummary": "Teacher asked where cold viruses originate."
            }
            """;

        TeacherMoveEvaluation result = evaluator.parseEvaluation(json, "Where do cold viruses come from?");

        assertNotNull(result);
        assertEquals(TeacherStrategy.PROBING, result.getStrategy());
        assertTrue(result.isAddressesMisconception());
        assertEquals("CLEAR_WITH_REASONING", result.getClarity());
        assertEquals(TransitionRecommendation.ADVANCE, result.getRecommendation());
        assertEquals("Teacher asked where cold viruses originate.", result.getTurnSummary());
    }

    @Test
    @DisplayName("Parse JSON embedded in markdown fences or extra conversational text")
    void testParseMarkdownWrappedJson() {
        String markdown = """
            Here is the pedagogical evaluation:
            ```json
            {
              "strategy": "GUIDED_DISCOVERY",
              "addressesMisconception": true,
              "clarity": "CLEAR_WITH_REASONING",
              "recommendation": "ADVANCE",
              "turnSummary": "Teacher guided student to think about how germs spread between people."
            }
            ```
            Hope this helps!
            """;

        TeacherMoveEvaluation result = evaluator.parseEvaluation(markdown, "How did Anthony catch the cold?");

        assertNotNull(result);
        assertEquals(TeacherStrategy.GUIDED_DISCOVERY, result.getStrategy());
        assertEquals(TransitionRecommendation.ADVANCE, result.getRecommendation());
    }

    @Test
    @DisplayName("Parse handles unknown strategy gracefully with defaults")
    void testParseUnknownStrategy() {
        String json = """
            {
              "strategy": "UNKNOWN_STRATEGY",
              "recommendation": "STAY",
              "turnSummary": "Teacher said hello."
            }
            """;

        TeacherMoveEvaluation result = evaluator.parseEvaluation(json, "Hello");

        assertNotNull(result);
        assertEquals(TeacherStrategy.PROBING, result.getStrategy());
        assertEquals(TransitionRecommendation.STAY, result.getRecommendation());
    }

    @Test
    @DisplayName("Malformed or empty response falls back gracefully without throwing exceptions")
    void testFallbackOnMalformedJson() {
        TeacherMoveEvaluation result = evaluator.parseEvaluation("This is not JSON at all! 404 error", "Why is Anthony sick?");

        assertNotNull(result);
        assertEquals(TeacherStrategy.PROBING, result.getStrategy());
        assertEquals(TransitionRecommendation.ADVANCE, result.getRecommendation());

        TeacherMoveEvaluation resultStatement = evaluator.parseEvaluation(null, "Basketball made him tired.");
        assertNotNull(resultStatement);
        assertEquals(TeacherStrategy.TELLING, resultStatement.getStrategy());
        assertEquals(TransitionRecommendation.STAY, resultStatement.getRecommendation());
    }
}
