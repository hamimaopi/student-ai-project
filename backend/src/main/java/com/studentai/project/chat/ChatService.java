package com.studentai.project.chat;

import com.studentai.project.ai.PromptBuilder;
import com.studentai.project.ai.StudentResponseGenerator;
import com.studentai.project.ai.TeacherMoveEvaluation;
import com.studentai.project.ai.TransitionEvaluator;
import com.studentai.project.chat.dto.ArbitrationResult;
import com.studentai.project.chat.dto.ChatSendResponse;
import com.studentai.project.classroom.Scenario;
import com.studentai.project.exception.ResourceNotFoundException;
import com.studentai.project.exception.SessionStateConflictException;
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
import java.util.UUID;

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
    private final ClassroomDiscourseArbiter discourseArbiter;

    public ChatSendResponse handleTeacherMessage(SendMessageRequest request) {
        // 1. Load Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + request.getSessionId()));

        if (session.getEndedAt() != null) {
            throw new SessionStateConflictException("Cannot send message to an ended session: " + session.getId());
        }

        // 2. Identify All Participants & Determine Last Student Speaker
        List<SessionParticipant> participants = participantRepository.findBySessionId(session.getId());
        if (participants.isEmpty()) {
            throw new SessionStateConflictException("No participants found in session: " + session.getId());
        }

        UUID lastSpeakerStudentId = messageRepository
                .findFirstBySessionIdAndSenderTypeOrderByTurnNumberDesc(session.getId(), SenderType.STUDENT)
                .map(m -> m.getStudent() != null ? m.getStudent().getId() : null)
                .orElse(null);

        // 3. Discourse Arbitration
        ArbitrationResult arbitration = discourseArbiter.arbitrate(
                request.getContent(),
                request.getTargetStudentId(),
                participants,
                lastSpeakerStudentId
        );

        SessionParticipant targetParticipant = arbitration.getTargetParticipant();
        Student targetStudent = targetParticipant.getStudent();
        SessionParticipant referencedParticipant = arbitration.getReferencedParticipant();
        Student referencedStudent = referencedParticipant != null ? referencedParticipant.getStudent() : null;
        String routingReason = arbitration.getRoutingReason();

        Scenario scenario = session.getScenario();
        StudentMentalModel mentalModel = targetParticipant.getMentalModel();
        String wrongBelief = mentalModel != null ? mentalModel.getWrongBelief() : "Conflates sequence with causation.";

        // 4. Save Teacher Message
        int maxTurn = messageRepository.findMaxTurnNumberBySessionId(session.getId());
        int teacherTurnNumber = maxTurn + 1;

        Message teacherMessage = Message.builder()
                .session(session)
                .senderType(SenderType.TEACHER)
                .student(null)
                .targetStudent(targetStudent)
                .referencedStudent(referencedStudent)
                .routingReason(routingReason)
                .content(request.getContent().trim())
                .turnNumber(teacherTurnNumber)
                .build();
        messageRepository.save(teacherMessage);

        // 5. Evaluate Teacher Move for Target Student
        TeacherMoveEvaluation evaluation = transitionEvaluator.evaluate(
                scenario.getDescription(),
                wrongBelief,
                targetParticipant.getCurrentState(),
                request.getContent()
        );

        // 6. Compute State Machine Transition for Target Student
        StateTransitionEngine.TransitionResult transition = stateTransitionEngine.computeNextState(
                targetParticipant.getCurrentState(),
                evaluation.getStrategy(),
                evaluation.getRecommendation(),
                targetParticipant.getTurnsInState()
        );

        log.info("Teacher move evaluated for student={}: strategy={}, rec={}, nextState={}, changed={}, reason='{}'",
                targetStudent.getName(),
                evaluation.getStrategy(), evaluation.getRecommendation(),
                transition.getNextState(), transition.isStateChanged(), transition.getReason());

        // 7. Update Target Participant State & Spoken Metrics
        int studentTurnNumber = teacherTurnNumber + 1;
        if (transition.isStateChanged()) {
            targetParticipant.setCurrentState(transition.getNextState());
            targetParticipant.resetTurnsInState();
        } else {
            targetParticipant.incrementTurnsInState();
        }

        String updatedSummary = (targetParticipant.getStateSummary() != null ? targetParticipant.getStateSummary() + " " : "")
                + evaluation.getTurnSummary();
        targetParticipant.setStateSummary(updatedSummary.trim());
        targetParticipant.recordTurnSpoken(studentTurnNumber);
        SessionParticipant savedParticipant = participantRepository.save(targetParticipant);

        // 8. Build Multi-Student History & Prompt, then Generate Response
        List<Message> history = messageRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
        String systemPrompt = promptBuilder.buildSystemPrompt(
                targetStudent,
                scenario,
                mentalModel,
                savedParticipant.getCurrentState(),
                savedParticipant.getTurnsInState(),
                savedParticipant.getStateSummary(),
                participants,
                arbitration.getReferencedPeerName()
        );
        String conversationHistory = promptBuilder.buildConversationHistory(history, targetStudent.getName());

        String studentReplyText = studentResponseGenerator.generateResponse(
                systemPrompt,
                conversationHistory,
                request.getContent(),
                targetStudent.getName()
        );

        // 9. Save Student Message
        Message studentMessage = Message.builder()
                .session(session)
                .senderType(SenderType.STUDENT)
                .student(targetStudent)
                .targetStudent(targetStudent)
                .referencedStudent(referencedStudent)
                .routingReason(routingReason)
                .studentStateSnapshot(savedParticipant.getCurrentState())
                .content(studentReplyText)
                .turnNumber(studentTurnNumber)
                .build();
        Message savedStudentMessage = messageRepository.save(studentMessage);

        // 10. Assemble Response DTO
        MessageResponse replyDto = MessageResponse.builder()
                .id(savedStudentMessage.getId())
                .sessionId(session.getId())
                .senderType(SenderType.STUDENT)
                .studentId(targetStudent.getId())
                .targetStudentId(targetStudent.getId())
                .referencedStudentId(referencedStudent != null ? referencedStudent.getId() : null)
                .routingReason(routingReason)
                .studentStateSnapshot(savedParticipant.getCurrentState())
                .senderName(targetStudent.getName())
                .avatarUrl(targetStudent.getAvatarUrl() != null ? targetStudent.getAvatarUrl() : "/images/avatar_sue.png")
                .content(savedStudentMessage.getContent())
                .turnNumber(savedStudentMessage.getTurnNumber())
                .createdAt(savedStudentMessage.getCreatedAt())
                .build();

        SessionParticipantResponse participantDto = SessionParticipantResponse.from(savedParticipant);

        List<SessionParticipantResponse> allParticipants = participants.stream()
                .map(p -> p.getId().equals(savedParticipant.getId()) ? savedParticipant : p)
                .map(SessionParticipantResponse::from)
                .toList();

        return ChatSendResponse.builder()
                .reply(replyDto)
                .participantState(participantDto)
                .allParticipants(allParticipants)
                .routedStudentName(targetStudent.getName())
                .routingReason(routingReason)
                .build();
    }
}
