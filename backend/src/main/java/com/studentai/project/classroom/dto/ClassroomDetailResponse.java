package com.studentai.project.classroom.dto;

import com.studentai.project.student.dto.StudentSummaryResponse;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomDetailResponse {
    private UUID id;
    private String subject;
    private String name;
    private String description;
    private List<ScenarioResponse> scenarios;
    private List<StudentSummaryResponse> students;
}
