package com.studentai.project.statemachine;

import lombok.Builder;
import lombok.Value;
import org.springframework.stereotype.Component;

@Component
public class StateTransitionEngine {

    @Value
    @Builder
    public static class TransitionResult {
        StudentState nextState;
        boolean stateChanged;
        String reason;
    }

    public TransitionResult computeNextState(
            StudentState currentState,
            TeacherStrategy strategy,
            TransitionRecommendation recommendation,
            int turnsInState
    ) {
        if (currentState == StudentState.UNDERSTANDING) {
            return TransitionResult.builder()
                    .nextState(StudentState.UNDERSTANDING)
                    .stateChanged(false)
                    .reason("Student already reached understanding.")
                    .build();
        }

        StudentState next = currentState;
        String reason = "Maintained current state.";

        switch (currentState) {
            case CONFIDENTLY_WRONG -> {
                if (strategy == TeacherStrategy.TELLING) {
                    next = StudentState.DEFENSIVE;
                    reason = "Directly telling the student they are wrong triggered defensiveness.";
                } else if ((strategy == TeacherStrategy.PROBING || strategy == TeacherStrategy.CONTRADICTION || strategy == TeacherStrategy.GUIDED_DISCOVERY)
                        && recommendation == TransitionRecommendation.ADVANCE) {
                    next = StudentState.CONFUSED;
                    reason = "Effective questioning exposed a flaw in the wrong belief, prompting confusion.";
                }
            }

            case DEFENSIVE -> {
                if (turnsInState >= 3) {
                    next = StudentState.CONFUSED;
                    reason = "Extended dialogue in defensive posture naturally softened into confusion.";
                } else if (strategy == TeacherStrategy.TELLING) {
                    next = StudentState.DEFENSIVE;
                    reason = "Continued telling reinforces defensiveness.";
                } else if (strategy == TeacherStrategy.PROBING || strategy == TeacherStrategy.CONTRADICTION || strategy == TeacherStrategy.GUIDED_DISCOVERY) {
                    next = StudentState.CONFUSED;
                    reason = "Diagnostic questioning softened resistance and created curiosity.";
                }
            }

            case CONFUSED -> {
                if (recommendation == TransitionRecommendation.ADVANCE) {
                    next = StudentState.TENTATIVELY_CORRECT;
                    reason = "Clear explanation or analogy helped the student grasp the correct mechanism.";
                } else if (recommendation == TransitionRecommendation.REGRESS) {
                    next = StudentState.DEFENSIVE;
                    reason = "Unclear or contradictory teacher guidance caused student to revert to defense.";
                }
            }

            case TENTATIVELY_CORRECT -> {
                if (strategy == TeacherStrategy.CONFIRMATION || recommendation == TransitionRecommendation.ADVANCE) {
                    next = StudentState.UNDERSTANDING;
                    reason = "Affirmation and guided synthesis solidified full understanding.";
                } else if (recommendation == TransitionRecommendation.REGRESS) {
                    next = StudentState.CONFUSED;
                    reason = "Introducing complex details too fast caused the student to lose confidence.";
                }
            }
        }

        return TransitionResult.builder()
                .nextState(next)
                .stateChanged(next != currentState)
                .reason(reason)
                .build();
    }
}
