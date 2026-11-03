package com.studentai.project.ai;

import com.studentai.project.statemachine.TeacherStrategy;
import com.studentai.project.statemachine.TransitionRecommendation;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TeacherMoveEvaluation {
    TeacherStrategy strategy;
    boolean addressesMisconception;
    String clarity;
    TransitionRecommendation recommendation;
    String turnSummary;
}
