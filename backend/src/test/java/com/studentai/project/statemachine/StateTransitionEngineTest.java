package com.studentai.project.statemachine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StateTransitionEngineTest {

    private StateTransitionEngine engine;

    @BeforeEach
    void setUp() {
        engine = new StateTransitionEngine();
    }

    @Test
    @DisplayName("CONFIDENTLY_WRONG + TELLING triggers DEFENSIVE state")
    void testConfidentlyWrongToDefensive() {
        var result = engine.computeNextState(
                StudentState.CONFIDENTLY_WRONG,
                TeacherStrategy.TELLING,
                TransitionRecommendation.STAY,
                0
        );

        assertEquals(StudentState.DEFENSIVE, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("CONFIDENTLY_WRONG + PROBING (ADVANCE) moves to CONFUSED")
    void testConfidentlyWrongToConfusedOnProbing() {
        var result = engine.computeNextState(
                StudentState.CONFIDENTLY_WRONG,
                TeacherStrategy.PROBING,
                TransitionRecommendation.ADVANCE,
                1
        );

        assertEquals(StudentState.CONFUSED, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("DEFENSIVE + TELLING keeps student DEFENSIVE (no progress)")
    void testDefensiveStaysDefensiveOnTelling() {
        var result = engine.computeNextState(
                StudentState.DEFENSIVE,
                TeacherStrategy.TELLING,
                TransitionRecommendation.STAY,
                1
        );

        assertEquals(StudentState.DEFENSIVE, result.getNextState());
        assertFalse(result.isStateChanged());
    }

    @Test
    @DisplayName("DEFENSIVE naturally softens to CONFUSED after 3 turns")
    void testDefensiveSoftensAfterThreeTurns() {
        var result = engine.computeNextState(
                StudentState.DEFENSIVE,
                TeacherStrategy.TELLING,
                TransitionRecommendation.STAY,
                3
        );

        assertEquals(StudentState.CONFUSED, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("CONFUSED + ADVANCE moves to TENTATIVELY_CORRECT")
    void testConfusedAdvancesToTentativelyCorrect() {
        var result = engine.computeNextState(
                StudentState.CONFUSED,
                TeacherStrategy.GUIDED_DISCOVERY,
                TransitionRecommendation.ADVANCE,
                1
        );

        assertEquals(StudentState.TENTATIVELY_CORRECT, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("CONFUSED + REGRESS reverts back to DEFENSIVE")
    void testConfusedRegressesToDefensive() {
        var result = engine.computeNextState(
                StudentState.CONFUSED,
                TeacherStrategy.TELLING,
                TransitionRecommendation.REGRESS,
                2
        );

        assertEquals(StudentState.DEFENSIVE, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("OFF_TOPIC leaves state unchanged for all states regardless of recommendation")
    void testOffTopicLeavesStateUnchangedAcrossAllStates() {
        for (StudentState state : StudentState.values()) {
            for (TransitionRecommendation rec : TransitionRecommendation.values()) {
                var result = engine.computeNextState(
                        state,
                        TeacherStrategy.OFF_TOPIC,
                        rec,
                        2
                );
                assertEquals(state, result.getNextState(), "State should be unchanged for " + state);
                assertFalse(result.isStateChanged(), "State changed should be false for " + state);
            }
        }
    }

    @Test
    @DisplayName("TENTATIVELY_CORRECT + CONFIRMATION achieves UNDERSTANDING")
    void testTentativelyCorrectToUnderstanding() {
        var result = engine.computeNextState(
                StudentState.TENTATIVELY_CORRECT,
                TeacherStrategy.CONFIRMATION,
                TransitionRecommendation.ADVANCE,
                1
        );

        assertEquals(StudentState.UNDERSTANDING, result.getNextState());
        assertTrue(result.isStateChanged());
    }

    @Test
    @DisplayName("UNDERSTANDING is terminal and does not regress")
    void testUnderstandingIsTerminal() {
        var result = engine.computeNextState(
                StudentState.UNDERSTANDING,
                TeacherStrategy.OFF_TOPIC,
                TransitionRecommendation.REGRESS,
                5
        );

        assertEquals(StudentState.UNDERSTANDING, result.getNextState());
        assertFalse(result.isStateChanged());
    }
}
