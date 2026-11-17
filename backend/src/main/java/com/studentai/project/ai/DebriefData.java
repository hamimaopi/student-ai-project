package com.studentai.project.ai;

import com.studentai.project.statemachine.StudentState;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebriefData {
    private boolean masteryAchieved;
    private StudentState finalStudentState;
    private int totalTurns;
    private String summary;
    private String breakthroughMoment;
    private String classroomManagementAdvice;
    private Map<String, Integer> strategyBreakdown;
    private Map<String, Integer> equityBreakdown;
    private Map<String, StudentOutcome> studentOutcomes;
    private List<String> strengths;
    private List<String> growthOpportunities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentOutcome {
        private String studentName;
        private StudentState initialState;
        private StudentState finalState;
        private int turnsSpoken;
        private String breakthroughMoment;
        private boolean masteryAchieved;
    }
}
