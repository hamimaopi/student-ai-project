package com.studentai.project.classroom;

import com.studentai.project.classroom.dto.ClassroomDetailResponse;
import com.studentai.project.classroom.dto.ScenarioResponse;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentRepository;
import com.studentai.project.student.dto.StudentSummaryResponse;
import com.studentai.project.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ScenarioRepository scenarioRepository;
    private final StudentRepository studentRepository;

    public List<ClassroomDetailResponse> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .map(this::toDetailResponse)
                .toList();
    }

    public ClassroomDetailResponse getClassroomById(UUID id) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found: " + id));
        return toDetailResponse(classroom);
    }

    private ClassroomDetailResponse toDetailResponse(Classroom classroom) {
        List<ScenarioResponse> scenarios = scenarioRepository.findByClassroomId(classroom.getId()).stream()
                .map(s -> ScenarioResponse.builder()
                        .id(s.getId())
                        .classroomId(classroom.getId())
                        .title(s.getTitle())
                        .description(s.getDescription())
                        .isAiGenerated(s.isAiGenerated())
                        .build())
                .toList();

        List<StudentSummaryResponse> students = studentRepository.findByClassroomId(classroom.getId()).stream()
                .map(this::toStudentSummary)
                .toList();

        return ClassroomDetailResponse.builder()
                .id(classroom.getId())
                .subject(classroom.getSubject())
                .name(classroom.getName())
                .description(classroom.getDescription())
                .scenarios(scenarios)
                .students(students)
                .build();
    }

    private StudentSummaryResponse toStudentSummary(Student student) {
        return StudentSummaryResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .personality(student.getPersonality())
                .gradeLevel(student.getGradeLevel())
                .avatarUrl(student.getAvatarUrl())
                .build();
    }
}
