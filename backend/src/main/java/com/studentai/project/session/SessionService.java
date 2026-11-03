package com.studentai.project.session;

import com.studentai.project.classroom.Classroom;
import com.studentai.project.classroom.ClassroomRepository;
import com.studentai.project.classroom.Scenario;
import com.studentai.project.classroom.ScenarioRepository;
import com.studentai.project.message.Message;
import com.studentai.project.message.MessageRepository;
import com.studentai.project.message.dto.MessageResponse;
import com.studentai.project.session.dto.CreateSessionRequest;
import com.studentai.project.session.dto.SessionParticipantResponse;
import com.studentai.project.session.dto.SessionResponse;
import com.studentai.project.exception.ResourceNotFoundException;
import com.studentai.project.exception.SessionStateConflictException;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.*;
import com.studentai.project.teacher.Teacher;
import com.studentai.project.teacher.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.ai.DebriefData;
import com.studentai.project.ai.DebriefEvaluator;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionParticipantRepository sessionParticipantRepository;
    private final ClassroomRepository classroomRepository;
    private final ScenarioRepository scenarioRepository;
    private final StudentRepository studentRepository;
    private final StudentMentalModelRepository mentalModelRepository;
    private final TeacherRepository teacherRepository;
    private final MessageRepository messageRepository;
    private final DebriefEvaluator debriefEvaluator;
    private final ObjectMapper objectMapper;

    public SessionResponse createSession(CreateSessionRequest request) {
        Teacher teacher = teacherRepository.findFirstByNameIgnoreCase(request.getTeacherName().trim())
                .map(existing -> {
                    existing.setAvatarBadge(request.getTeacherBadge());
                    return teacherRepository.save(existing);
                })
                .orElseGet(() -> teacherRepository.save(Teacher.builder()
                        .name(request.getTeacherName().trim())
                        .avatarBadge(request.getTeacherBadge())
                        .build()));

        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found: " + request.getClassroomId()));

        Scenario scenario = scenarioRepository.findById(request.getScenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + request.getScenarioId()));

        Session session = Session.builder()
                .teacher(teacher)
                .classroom(classroom)
                .scenario(scenario)
                .build();

        Session savedSession = sessionRepository.save(session);

        List<Student> studentsToSeat;
        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            studentsToSeat = studentRepository.findAllById(request.getStudentIds());
        } else {
            studentsToSeat = studentRepository.findByClassroomId(classroom.getId());
        }

        if (studentsToSeat.isEmpty()) {
            throw new SessionStateConflictException("No students available to seat in classroom: " + classroom.getId());
        }

        for (Student student : studentsToSeat) {
            StudentMentalModel mentalModel = mentalModelRepository
                    .findByScenarioIdAndStudentId(scenario.getId(), student.getId())
                    .orElse(null);

            SessionParticipant participant = SessionParticipant.builder()
                    .session(savedSession)
                    .student(student)
                    .mentalModel(mentalModel)
                    .currentState(StudentState.CONFIDENTLY_WRONG)
                    .turnsInState(0)
                    .stateSummary("Session started with initial misconception.")
                    .build();

            savedSession.addParticipant(participant);
        }

        Session fullyPopulated = sessionRepository.save(savedSession);
        return toSessionResponse(fullyPopulated);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSessionById(UUID id) {
        Session session = sessionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));
        return toSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getAllSessions() {
        return sessionRepository.findAllWithDetails().stream()
                .map(this::toSessionResponse)
                .toList();
    }

    public SessionResponse endSession(UUID id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        if (session.getEndedAt() == null) {
            session.setEndedAt(Instant.now());
        }

        if (session.getDebrief() == null) {
            List<Message> messages = messageRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
            SessionParticipant participant = session.getParticipants().isEmpty() ? null : session.getParticipants().get(0);
            StudentState finalState = participant != null ? participant.getCurrentState() : StudentState.CONFIDENTLY_WRONG;
            String studentName = participant != null ? participant.getStudent().getName() : "Sue";
            String wrongBelief = participant != null && participant.getMentalModel() != null
                    ? participant.getMentalModel().getWrongBelief()
                    : "Believes tiredness caused cold.";

            DebriefData debrief = debriefEvaluator.generateDebrief(
                    session.getScenario().getTitle(),
                    session.getScenario().getDescription(),
                    studentName,
                    wrongBelief,
                    finalState,
                    messages
            );

            try {
                session.setDebrief(objectMapper.writeValueAsString(debrief));
            } catch (Exception e) {
                log.warn("Failed to serialize debrief to JSON: {}", e.getMessage());
            }
        }

        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public DebriefData getSessionDebrief(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        if (session.getDebrief() == null) {
            return null;
        }
        try {
            return objectMapper.readValue(session.getDebrief(), DebriefData.class);
        } catch (Exception e) {
            log.warn("Failed to deserialize debrief JSON: {}", e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getSessionMessages(UUID sessionId) {
        return messageRepository.findBySessionIdOrderByTurnNumberAsc(sessionId).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    private SessionResponse toSessionResponse(Session session) {
        List<SessionParticipantResponse> participantResponses = session.getParticipants().stream()
                .map(p -> SessionParticipantResponse.builder()
                        .id(p.getId())
                        .studentId(p.getStudent().getId())
                        .studentName(p.getStudent().getName())
                        .avatarUrl(p.getStudent().getAvatarUrl())
                        .personality(p.getStudent().getPersonality())
                        .currentState(p.getCurrentState())
                        .turnsInState(p.getTurnsInState())
                        .stateSummary(p.getStateSummary())
                        .build())
                .toList();

        int maxTurn = messageRepository.findMaxTurnNumberBySessionId(session.getId());

        DebriefData debriefData = null;
        if (session.getDebrief() != null) {
            try {
                debriefData = objectMapper.readValue(session.getDebrief(), DebriefData.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize debrief JSON: {}", e.getMessage());
            }
        }

        return SessionResponse.builder()
                .id(session.getId())
                .teacherName(session.getTeacher() != null ? session.getTeacher().getName() : "Teacher")
                .teacherBadge(session.getTeacher() != null ? session.getTeacher().getAvatarBadge() : "fox")
                .classroomId(session.getClassroom().getId())
                .classroomName(session.getClassroom().getName())
                .subject(session.getClassroom().getSubject())
                .scenarioId(session.getScenario().getId())
                .scenarioTitle(session.getScenario().getTitle())
                .scenarioDescription(session.getScenario().getDescription())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .participants(participantResponses)
                .turnCount(maxTurn)
                .debrief(debriefData)
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        String senderName;
        String avatarUrl;

        if (message.getSenderType() == com.studentai.project.message.SenderType.TEACHER) {
            senderName = message.getSession().getTeacher() != null
                    ? message.getSession().getTeacher().getName()
                    : "Teacher";
            String badge = message.getSession().getTeacher() != null
                    ? message.getSession().getTeacher().getAvatarBadge()
                    : "fox";
            avatarUrl = "/images/badge_" + badge + ".png";
        } else {
            senderName = message.getStudent() != null ? message.getStudent().getName() : "Student";
            avatarUrl = message.getStudent() != null ? message.getStudent().getAvatarUrl() : "/images/avatar_sue.jpg";
        }

        return MessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .senderType(message.getSenderType())
                .studentId(message.getStudent() != null ? message.getStudent().getId() : null)
                .senderName(senderName)
                .avatarUrl(avatarUrl)
                .content(message.getContent())
                .turnNumber(message.getTurnNumber())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
