package com.studentai.project.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.ai.DebriefData;
import com.studentai.project.ai.DebriefEvaluator;
import com.studentai.project.classroom.Classroom;
import com.studentai.project.classroom.ClassroomRepository;
import com.studentai.project.classroom.Scenario;
import com.studentai.project.classroom.ScenarioRepository;
import com.studentai.project.message.MessageRepository;
import com.studentai.project.session.dto.CreateSessionRequest;
import com.studentai.project.session.dto.SessionResponse;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import com.studentai.project.student.StudentMentalModelRepository;
import com.studentai.project.student.StudentRepository;
import com.studentai.project.teacher.Teacher;
import com.studentai.project.teacher.TeacherRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionParticipantRepository sessionParticipantRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private ScenarioRepository scenarioRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentMentalModelRepository mentalModelRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private DebriefEvaluator debriefEvaluator;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SessionService sessionService;

    @Test
    @DisplayName("createSession seats all 3 students with distinct initial states and initialized metrics")
    void testCreateSessionWithMultiStudents() {
        UUID classroomId = UUID.randomUUID();
        UUID scenarioId = UUID.randomUUID();

        Teacher teacher = Teacher.builder()
                .id(UUID.randomUUID())
                .name("Alex")
                .avatarBadge("fox")
                .createdAt(Instant.now())
                .build();

        Classroom classroom = Classroom.builder()
                .id(classroomId)
                .subject("SCIENCE")
                .name("8th Grade Life Science")
                .build();

        Scenario scenario = Scenario.builder()
                .id(scenarioId)
                .classroom(classroom)
                .title("Disease Transmission: The Basketball Game")
                .description("Scenario description...")
                .build();

        Student marcus = Student.builder()
                .id(UUID.randomUUID())
                .name("Marcus")
                .personality("Energetic and eager")
                .gradeLevel("8th Grade")
                .avatarUrl("/images/avatar_marcus.png")
                .participationWeight(40)
                .speakingStyle("Excited")
                .build();

        Student lena = Student.builder()
                .id(UUID.randomUUID())
                .name("Lena")
                .personality("Quiet and observant")
                .gradeLevel("8th Grade")
                .avatarUrl("/images/avatar_lena.png")
                .participationWeight(20)
                .speakingStyle("Hesitant")
                .build();

        Student sue = Student.builder()
                .id(UUID.randomUUID())
                .name("Sue")
                .personality("Gifted and curious")
                .gradeLevel("8th Grade")
                .avatarUrl("/images/avatar_sue.png")
                .participationWeight(40)
                .speakingStyle("Analytical")
                .build();

        StudentMentalModel marcusModel = StudentMentalModel.builder()
                .id(UUID.randomUUID())
                .student(marcus)
                .scenario(scenario)
                .wrongBelief("Basketball caused cold")
                .initialState(StudentState.CONFIDENTLY_WRONG)
                .build();

        StudentMentalModel lenaModel = StudentMentalModel.builder()
                .id(UUID.randomUUID())
                .student(lena)
                .scenario(scenario)
                .wrongBelief("Cold gym causes colds")
                .initialState(StudentState.CONFIDENTLY_WRONG)
                .build();

        StudentMentalModel sueModel = StudentMentalModel.builder()
                .id(UUID.randomUUID())
                .student(sue)
                .scenario(scenario)
                .wrongBelief("Exhaustion causes colds")
                .initialState(StudentState.CONFIDENTLY_WRONG)
                .build();

        when(teacherRepository.findFirstByNameIgnoreCase("Alex")).thenReturn(Optional.of(teacher));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(studentRepository.findByClassroomId(classroomId)).thenReturn(List.of(marcus, lena, sue));

        when(mentalModelRepository.findByScenarioIdAndStudentId(scenarioId, marcus.getId())).thenReturn(Optional.of(marcusModel));
        when(mentalModelRepository.findByScenarioIdAndStudentId(scenarioId, lena.getId())).thenReturn(Optional.of(lenaModel));
        when(mentalModelRepository.findByScenarioIdAndStudentId(scenarioId, sue.getId())).thenReturn(Optional.of(sueModel));

        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session s = invocation.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
                s.setStartedAt(Instant.now());
            }
            return s;
        });

        when(messageRepository.findMaxTurnNumberBySessionId(any())).thenReturn(0);

        CreateSessionRequest request = CreateSessionRequest.builder()
                .teacherName("Alex")
                .teacherBadge("fox")
                .classroomId(classroomId)
                .scenarioId(scenarioId)
                .build();

        SessionResponse response = sessionService.createSession(request);

        assertNotNull(response);
        assertEquals(3, response.getParticipants().size());

        var marcusParticipant = response.getParticipants().stream()
                .filter(p -> p.getStudentName().equals("Marcus"))
                .findFirst()
                .orElseThrow();
        assertEquals(StudentState.CONFIDENTLY_WRONG, marcusParticipant.getCurrentState());
        assertEquals(0, marcusParticipant.getTurnsSpoken());
        assertEquals(40, marcusParticipant.getParticipationWeight());

        var lenaParticipant = response.getParticipants().stream()
                .filter(p -> p.getStudentName().equals("Lena"))
                .findFirst()
                .orElseThrow();
        assertEquals(StudentState.CONFIDENTLY_WRONG, lenaParticipant.getCurrentState());
        assertEquals(0, lenaParticipant.getTurnsSpoken());
        assertEquals(20, lenaParticipant.getParticipationWeight());

        var sueParticipant = response.getParticipants().stream()
                .filter(p -> p.getStudentName().equals("Sue"))
                .findFirst()
                .orElseThrow();
        assertEquals(StudentState.CONFIDENTLY_WRONG, sueParticipant.getCurrentState());
        assertEquals(0, sueParticipant.getTurnsSpoken());
        assertEquals(40, sueParticipant.getParticipationWeight());
    }

    @Test
    @DisplayName("endSession generates multi-student debrief and sets endedAt")
    void testEndSessionGeneratesMultiStudentDebrief() {
        UUID sessionId = UUID.randomUUID();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).subject("SCIENCE").name("Science").build();
        Scenario scenario = Scenario.builder()
                .id(UUID.randomUUID())
                .title("Disease Transmission")
                .description("Sample description")
                .classroom(classroom)
                .build();

        Student marcus = Student.builder().id(UUID.randomUUID()).name("Marcus").avatarUrl("/avatar.png").build();
        SessionParticipant pMarcus = SessionParticipant.builder()
                .id(UUID.randomUUID())
                .student(marcus)
                .currentState(StudentState.UNDERSTANDING)
                .build();

        Session session = Session.builder()
                .id(sessionId)
                .scenario(scenario)
                .classroom(classroom)
                .participants(List.of(pMarcus))
                .startedAt(Instant.now().minusSeconds(300))
                .build();

        DebriefData mockDebrief = DebriefData.builder()
                .masteryAchieved(true)
                .summary("Classroom breakthrough")
                .equityBreakdown(java.util.Map.of("Marcus", 100))
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId)).thenReturn(List.of());
        when(debriefEvaluator.generateDebrief(eq("Disease Transmission"), eq("Sample description"), anyList(), anyList()))
                .thenReturn(mockDebrief);
        when(sessionRepository.save(any(Session.class))).thenAnswer(i -> i.getArgument(0));

        SessionResponse response = sessionService.endSession(sessionId);

        assertNotNull(response);
        assertNotNull(response.getEndedAt());
        verify(debriefEvaluator).generateDebrief(eq("Disease Transmission"), eq("Sample description"), eq(session.getParticipants()), anyList());
    }
}
