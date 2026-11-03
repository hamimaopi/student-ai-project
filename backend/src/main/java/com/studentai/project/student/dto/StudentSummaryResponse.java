package com.studentai.project.student.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSummaryResponse {
    private UUID id;
    private String name;
    private String personality;
    private String gradeLevel;
    private String avatarUrl;
}
