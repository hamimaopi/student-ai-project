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

    @Test
    @DisplayName("Fallback classifies greetings as OFF_TOPIC with STAY recommendation")
    void testFallbackGreetings() {
        TeacherMoveEvaluation hiGuys = evaluator.fallbackEvaluation("Hi guys");
        assertEquals(TeacherStrategy.OFF_TOPIC, hiGuys.getStrategy());
        assertFalse(hiGuys.isAddressesMisconception());
        assertEquals(TransitionRecommendation.STAY, hiGuys.getRecommendation());

        TeacherMoveEvaluation goodMorning = evaluator.fallbackEvaluation("Good morning everyone!");
        assertEquals(TeacherStrategy.OFF_TOPIC, goodMorning.getStrategy());
        assertFalse(goodMorning.isAddressesMisconception());
    }

    @Test
    @DisplayName("Fallback classifies casual questions as OFF_TOPIC")
    void testFallbackCasualQuestions() {
        TeacherMoveEvaluation howAreYou = evaluator.fallbackEvaluation("How are you all?");
        assertEquals(TeacherStrategy.OFF_TOPIC, howAreYou.getStrategy());
        assertFalse(howAreYou.isAddressesMisconception());
        assertEquals(TransitionRecommendation.STAY, howAreYou.getRecommendation());

        TeacherMoveEvaluation weekend = evaluator.fallbackEvaluation("What did you do over the weekend?");
        assertEquals(TeacherStrategy.OFF_TOPIC, weekend.getStrategy());
        assertFalse(weekend.isAddressesMisconception());
    }

    @Test
    @DisplayName("Fallback classifies personal questions as OFF_TOPIC")
    void testFallbackPersonalQuestions() {
        TeacherMoveEvaluation funFact = evaluator.fallbackEvaluation("Can you guys tell me a fun fact about yourselves?");
        assertEquals(TeacherStrategy.OFF_TOPIC, funFact.getStrategy());
        assertFalse(funFact.isAddressesMisconception());
        assertEquals(TransitionRecommendation.STAY, funFact.getRecommendation());
    }

    @Test
    @DisplayName("Fallback classifies mixed greeting and academic questions as PROBING")
    void testFallbackMixedQuestions() {
        TeacherMoveEvaluation mixed = evaluator.fallbackEvaluation("Hi Sue, what do you think made Anthony sick?");
        assertEquals(TeacherStrategy.PROBING, mixed.getStrategy());
        assertTrue(mixed.isAddressesMisconception());
        assertEquals(TransitionRecommendation.ADVANCE, mixed.getRecommendation());
    }

    @Test
    @DisplayName("Fallback classifies academic questions as PROBING")
    void testFallbackAcademicQuestions() {
        TeacherMoveEvaluation academic = evaluator.fallbackEvaluation("Where do cold viruses actually originate from?");
        assertEquals(TeacherStrategy.PROBING, academic.getStrategy());
        assertTrue(academic.isAddressesMisconception());
        assertEquals(TransitionRecommendation.ADVANCE, academic.getRecommendation());
    }

    @Test
    @DisplayName("Parse JSON with OFF_TOPIC sets addressesMisconception false and summary appropriately")
    void testParseOffTopicJson() {
        String json = """
            {
              "strategy": "OFF_TOPIC",
              "addressesMisconception": false,
              "clarity": "CLEAR_WITH_REASONING",
              "recommendation": "STAY",
              "turnSummary": "Teacher said hello."
            }
            """;

        TeacherMoveEvaluation result = evaluator.parseEvaluation(json, "Hello everyone!");
        assertNotNull(result);
        assertEquals(TeacherStrategy.OFF_TOPIC, result.getStrategy());
        assertFalse(result.isAddressesMisconception());
        assertEquals(TransitionRecommendation.STAY, result.getRecommendation());
    }
}
