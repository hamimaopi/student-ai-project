package com.studentai.project.classroom.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenarioResponse {
    private UUID id;
    private UUID classroomId;
    private String title;
    private String description;
    private boolean isAiGenerated;
}
