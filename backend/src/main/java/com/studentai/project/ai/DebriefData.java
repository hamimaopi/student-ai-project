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
    private Map<String, Integer> strategyBreakdown;
    private List<String> strengths;
    private List<String> growthOpportunities;
}
