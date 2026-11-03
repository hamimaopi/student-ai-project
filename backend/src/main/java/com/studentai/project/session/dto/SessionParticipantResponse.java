package com.studentai.project.session.dto;

import com.studentai.project.statemachine.StudentState;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionParticipantResponse {
    private UUID id;
    private UUID studentId;
    private String studentName;
    private String avatarUrl;
    private String personality;
    private StudentState currentState;
    private int turnsInState;
    private String stateSummary;
}
