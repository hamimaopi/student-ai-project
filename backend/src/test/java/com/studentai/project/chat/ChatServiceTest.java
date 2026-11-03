package com.studentai.project.chat;

import com.studentai.project.ai.PromptBuilder;
import com.studentai.project.ai.StudentResponseGenerator;
import com.studentai.project.ai.TeacherMoveEvaluation;
import com.studentai.project.ai.TransitionEvaluator;
import com.studentai.project.chat.dto.ChatSendResponse;
import com.studentai.project.classroom.Classroom;
import com.studentai.project.classroom.Scenario;
import com.studentai.project.message.Message;
import com.studentai.project.message.MessageRepository;
import com.studentai.project.message.SenderType;
import com.studentai.project.message.dto.SendMessageRequest;
import com.studentai.project.session.Session;
import com.studentai.project.session.SessionParticipant;
import com.studentai.project.session.SessionParticipantRepository;
import com.studentai.project.session.SessionRepository;
import com.studentai.project.statemachine.StateTransitionEngine;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.statemachine.TeacherStrategy;
import com.studentai.project.statemachine.TransitionRecommendation;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import com.studentai.project.teacher.Teacher;
import org.junit.jupiter.api.BeforeEach;
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
class ChatServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionParticipantRepository participantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private TransitionEvaluator transitionEvaluator;

    @Mock
    private StateTransitionEngine stateTransitionEngine;

    @Mock
    private PromptBuilder promptBuilder;

    @Mock
    private StudentResponseGenerator studentResponseGenerator;

    @InjectMocks
    private ChatService chatService;

    private UUID sessionId;
    private Session session;
    private Student student;
    private SessionParticipant participant;
    private Scenario scenario;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();

        Teacher teacher = Teacher.builder()
                .id(UUID.randomUUID())
                .name("Ms. Frizzle")
                .avatarBadge("owl")
                .build();

        Classroom classroom = Classroom.builder()
                .id(UUID.randomUUID())
                .name("Science 8A")
                .subject("Science")
                .build();

        scenario = Scenario.builder()
                .id(UUID.randomUUID())
                .classroom(classroom)
                .title("Cold Virus")
                .description("Sam had a cold and sat near Anthony...")
                .build();

        session = Session.builder()
                .id(sessionId)
                .classroom(classroom)
                .scenario(scenario)
                .teacher(teacher)
                .startedAt(Instant.now())
                .build();

        student = Student.builder()
                .id(UUID.randomUUID())
                .name("Sue")
                .gradeLevel("8th grade")
                .personality("Thoughtful and hesitant")
                .avatarUrl("/images/avatar_sue.jpg")
                .build();

        StudentMentalModel mentalModel = StudentMentalModel.builder()
                .id(UUID.randomUUID())
                .student(student)
                .scenario(scenario)
                .wrongBelief("Running in basketball caused the cold")
                .whyItFeelsRight("He felt exhausted")
                .build();

        participant = SessionParticipant.builder()
                .id(UUID.randomUUID())
                .session(session)
                .student(student)
                .mentalModel(mentalModel)
                .currentState(StudentState.CONFIDENTLY_WRONG)
                .turnsInState(0)
                .build();
    }

    @Test
    @DisplayName("Throws exception if session does not exist")
    void testSessionNotFound() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        SendMessageRequest request = SendMessageRequest.builder()
                .sessionId(sessionId)
                .content("Hello")
                .build();

        assertThrows(IllegalArgumentException.class, () -> chatService.handleTeacherMessage(request));
    }

    @Test
    @DisplayName("Throws exception if session has already ended")
    void testSessionEnded() {
        session.setEndedAt(Instant.now());
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        SendMessageRequest request = SendMessageRequest.builder()
                .sessionId(sessionId)
                .content("Hello")
                .build();

        assertThrows(IllegalStateException.class, () -> chatService.handleTeacherMessage(request));
    }

    @Test
    @DisplayName("Processes teacher message, evaluates transition, and generates student reply")
    void testHandleTeacherMessageSuccess() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionId(sessionId)).thenReturn(List.of(participant));
        when(messageRepository.findMaxTurnNumberBySessionId(sessionId)).thenReturn(0);

        TeacherMoveEvaluation evaluation = TeacherMoveEvaluation.builder()
                .strategy(TeacherStrategy.PROBING)
                .recommendation(TransitionRecommendation.ADVANCE)
                .addressesMisconception(true)
                .clarity("CLEAR_WITH_REASONING")
                .turnSummary("Teacher probed student's logic.")
                .build();
        when(transitionEvaluator.evaluate(any(), any(), any(), any())).thenReturn(evaluation);

        StateTransitionEngine.TransitionResult transition = StateTransitionEngine.TransitionResult.builder()
                .nextState(StudentState.CONFUSED)
                .stateChanged(true)
                .reason("Probing question provoked reflection.")
                .build();
        when(stateTransitionEngine.computeNextState(eq(StudentState.CONFIDENTLY_WRONG), eq(TeacherStrategy.PROBING), eq(TransitionRecommendation.ADVANCE), eq(0)))
                .thenReturn(transition);

        when(participantRepository.save(any(SessionParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId)).thenReturn(List.of());
        when(promptBuilder.buildSystemPrompt(any(), any(), any(), any(), anyInt(), any())).thenReturn("System prompt");
        when(promptBuilder.buildConversationHistory(any(), any())).thenReturn("History");
        when(studentResponseGenerator.generateResponse(any(), any(), any(), any())).thenReturn("Wait... maybe viruses don't come from running?");

        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
            Message m = invocation.getArgument(0);
            return Message.builder()
                    .id(UUID.randomUUID())
                    .session(m.getSession())
                    .senderType(m.getSenderType())
                    .student(m.getStudent())
                    .content(m.getContent())
                    .turnNumber(m.getTurnNumber())
                    .createdAt(Instant.now())
                    .build();
        });

        SendMessageRequest request = SendMessageRequest.builder()
                .sessionId(sessionId)
                .targetStudentId(student.getId())
                .content("Where do you think cold viruses actually originate from?")
                .build();

        ChatSendResponse response = chatService.handleTeacherMessage(request);

        assertNotNull(response);
        assertNotNull(response.getReply());
        assertEquals("Wait... maybe viruses don't come from running?", response.getReply().getContent());
        assertEquals(SenderType.STUDENT, response.getReply().getSenderType());
        assertEquals(student.getName(), response.getReply().getSenderName());

        assertNotNull(response.getParticipantState());
        assertEquals(StudentState.CONFUSED, response.getParticipantState().getCurrentState());
        assertEquals(0, response.getParticipantState().getTurnsInState());

        // Verify two messages saved: teacher (turn 1) and student (turn 2)
        verify(messageRepository, times(2)).save(any(Message.class));
    }
}
