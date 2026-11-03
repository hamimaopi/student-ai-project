package com.studentai.project.session.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {
    private UUID id;
    private String teacherName;
    private String teacherBadge;
    private UUID classroomId;
    private String classroomName;
    private String subject;
    private UUID scenarioId;
    private String scenarioTitle;
    private String scenarioDescription;
    private Instant startedAt;
    private Instant endedAt;
    private List<SessionParticipantResponse> participants;
    private int turnCount;
    private com.studentai.project.ai.DebriefData debrief;
}
