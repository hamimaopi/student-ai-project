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
    private StudentState initialState;
    private StudentState currentState;
    private int turnsInState;
    private int turnsSpoken;
    private Integer lastSpokeAtTurn;
    private Integer participationWeight;
    private String stateSummary;

    public static SessionParticipantResponse from(com.studentai.project.session.SessionParticipant p) {
        if (p == null) {
            return null;
        }
        StudentState init = p.getMentalModel() != null && p.getMentalModel().getInitialState() != null
                ? p.getMentalModel().getInitialState()
                : StudentState.CONFIDENTLY_WRONG;

        return SessionParticipantResponse.builder()
                .id(p.getId())
                .studentId(p.getStudent() != null ? p.getStudent().getId() : null)
                .studentName(p.getStudent() != null ? p.getStudent().getName() : null)
                .avatarUrl(p.getStudent() != null ? p.getStudent().getAvatarUrl() : null)
                .personality(p.getStudent() != null ? p.getStudent().getPersonality() : null)
                .participationWeight(p.getStudent() != null ? p.getStudent().getParticipationWeight() : null)
                .initialState(init)
                .currentState(p.getCurrentState())
                .turnsInState(p.getTurnsInState())
                .turnsSpoken(p.getTurnsSpoken())
                .lastSpokeAtTurn(p.getLastSpokeAtTurn())
                .stateSummary(p.getStateSummary())
                .build();
    }
}
