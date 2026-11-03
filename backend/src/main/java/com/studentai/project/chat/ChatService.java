package com.studentai.project.chat;

import com.studentai.project.ai.PromptBuilder;
import com.studentai.project.ai.StudentResponseGenerator;
import com.studentai.project.ai.TeacherMoveEvaluation;
import com.studentai.project.ai.TransitionEvaluator;
import com.studentai.project.chat.dto.ChatSendResponse;
import com.studentai.project.classroom.Scenario;
import com.studentai.project.message.Message;
import com.studentai.project.message.MessageRepository;
import com.studentai.project.message.SenderType;
import com.studentai.project.message.dto.MessageResponse;
import com.studentai.project.message.dto.SendMessageRequest;
import com.studentai.project.session.Session;
import com.studentai.project.session.SessionParticipant;
import com.studentai.project.session.SessionParticipantRepository;
import com.studentai.project.session.SessionRepository;
import com.studentai.project.session.dto.SessionParticipantResponse;
import com.studentai.project.statemachine.StateTransitionEngine;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final SessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final TransitionEvaluator transitionEvaluator;
    private final StateTransitionEngine stateTransitionEngine;
    private final PromptBuilder promptBuilder;
    private final StudentResponseGenerator studentResponseGenerator;

    public ChatSendResponse handleTeacherMessage(SendMessageRequest request) {
        // 1. Load Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + request.getSessionId()));

        if (session.getEndedAt() != null) {
            throw new IllegalStateException("Cannot send message to an ended session: " + session.getId());
        }

        // 2. Identify Target Participant
        List<SessionParticipant> participants = participantRepository.findBySessionId(session.getId());
        if (participants.isEmpty()) {
            throw new IllegalStateException("No participants found in session: " + session.getId());
        }

        SessionParticipant participant;
        if (request.getTargetStudentId() != null) {
            participant = participants.stream()
                    .filter(p -> p.getStudent().getId().equals(request.getTargetStudentId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Student not in session: " + request.getTargetStudentId()));
        } else {
            participant = participants.get(0);
        }

        Student student = participant.getStudent();
        Scenario scenario = session.getScenario();
        StudentMentalModel mentalModel = participant.getMentalModel();
        String wrongBelief = mentalModel != null ? mentalModel.getWrongBelief() : "Conflates sequence with causation.";

        // 3. Save Teacher Message
        int maxTurn = messageRepository.findMaxTurnNumberBySessionId(session.getId());
        int teacherTurnNumber = maxTurn + 1;

        Message teacherMessage = Message.builder()
                .session(session)
                .senderType(SenderType.TEACHER)
                .student(null)
                .content(request.getContent().trim())
                .turnNumber(teacherTurnNumber)
                .build();
        messageRepository.save(teacherMessage);

        // 4. Evaluate Teacher Move
        TeacherMoveEvaluation evaluation = transitionEvaluator.evaluate(
                scenario.getDescription(),
                wrongBelief,
                participant.getCurrentState(),
                request.getContent()
        );

        // 5. Compute State Machine Transition
        StateTransitionEngine.TransitionResult transition = stateTransitionEngine.computeNextState(
                participant.getCurrentState(),
                evaluation.getStrategy(),
                evaluation.getRecommendation(),
                participant.getTurnsInState()
        );

        log.info("Teacher message evaluated: strategy={}, rec={}, nextState={}, changed={}, reason='{}'",
                evaluation.getStrategy(), evaluation.getRecommendation(),
                transition.getNextState(), transition.isStateChanged(), transition.getReason());

        // 6. Update Participant State
        if (transition.isStateChanged()) {
            participant.setCurrentState(transition.getNextState());
            participant.resetTurnsInState();
        } else {
            participant.incrementTurnsInState();
        }

        String updatedSummary = (participant.getStateSummary() != null ? participant.getStateSummary() + " " : "")
                + evaluation.getTurnSummary();
        participant.setStateSummary(updatedSummary.trim());
        SessionParticipant savedParticipant = participantRepository.save(participant);

        // 7. Build Fresh Prompt & Generate Student Response
        List<Message> history = messageRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
        String systemPrompt = promptBuilder.buildSystemPrompt(
                student,
                scenario,
                mentalModel,
                savedParticipant.getCurrentState(),
                savedParticipant.getTurnsInState(),
                savedParticipant.getStateSummary()
        );
        String conversationHistory = promptBuilder.buildConversationHistory(history, student.getName());

        String studentReplyText = studentResponseGenerator.generateResponse(
                systemPrompt,
                conversationHistory,
                request.getContent(),
                student.getName()
        );

        // 8. Save Student Message
        int studentTurnNumber = teacherTurnNumber + 1;
        Message studentMessage = Message.builder()
                .session(session)
                .senderType(SenderType.STUDENT)
                .student(student)
                .content(studentReplyText)
                .turnNumber(studentTurnNumber)
                .build();
        Message savedStudentMessage = messageRepository.save(studentMessage);

        // 9. Return Response
        MessageResponse replyDto = MessageResponse.builder()
                .id(savedStudentMessage.getId())
                .sessionId(session.getId())
                .senderType(SenderType.STUDENT)
                .studentId(student.getId())
                .senderName(student.getName())
                .avatarUrl(student.getAvatarUrl() != null ? student.getAvatarUrl() : "/images/avatar_sue.jpg")
                .content(savedStudentMessage.getContent())
                .turnNumber(savedStudentMessage.getTurnNumber())
                .createdAt(savedStudentMessage.getCreatedAt())
                .build();

        SessionParticipantResponse participantDto = SessionParticipantResponse.builder()
                .id(savedParticipant.getId())
                .studentId(student.getId())
                .studentName(student.getName())
                .avatarUrl(student.getAvatarUrl())
                .personality(student.getPersonality())
                .currentState(savedParticipant.getCurrentState())
                .turnsInState(savedParticipant.getTurnsInState())
                .stateSummary(savedParticipant.getStateSummary())
                .build();

        return ChatSendResponse.builder()
                .reply(replyDto)
                .participantState(participantDto)
                .build();
    }
}
