package com.studentai.project.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionRequest {

    @NotBlank(message = "Teacher name is required")
    private String teacherName;

    @Builder.Default
    private String teacherBadge = "fox";

    @NotNull(message = "Classroom ID is required")
    private UUID classroomId;

    @NotNull(message = "Scenario ID is required")
    private UUID scenarioId;

    private List<UUID> studentIds;
}
