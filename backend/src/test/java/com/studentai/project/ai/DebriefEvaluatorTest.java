package com.studentai.project.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentai.project.message.Message;
import com.studentai.project.message.SenderType;
import com.studentai.project.session.SessionParticipant;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class DebriefEvaluatorTest {

    @Mock
    private ChatModel chatModel;

    private DebriefEvaluator evaluator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        evaluator = new DebriefEvaluator(chatModel, objectMapper);
    }

    @Test
    @DisplayName("Parse valid single-student debrief response JSON")
    void testParseValidDebriefJson() {
        String json = """
            {
              "summary": "Great guided discovery dialogue that challenged Sue's misconception.",
              "breakthroughMoment": "Turn 4: Sue realized viruses take days to show symptoms.",
              "strategyBreakdown": {
                "PROBING": 50,
                "GUIDED_DISCOVERY": 35,
                "TELLING": 15
              },
              "strengths": [
                "Asked open questions instead of declaring the student wrong.",
                "Kept Sue engaged in reasoning."
              ],
              "growthOpportunities": [
                "Consider asking where germs come from earlier in the discussion."
              ]
            }
            """;

        DebriefData debrief = evaluator.parseDebriefResponse(json, StudentState.UNDERSTANDING, 6, "Sue", true);

        assertNotNull(debrief);
        assertTrue(debrief.isMasteryAchieved());
        assertEquals(StudentState.UNDERSTANDING, debrief.getFinalStudentState());
        assertEquals(6, debrief.getTotalTurns());
        assertEquals("Great guided discovery dialogue that challenged Sue's misconception.", debrief.getSummary());
        assertEquals("Turn 4: Sue realized viruses take days to show symptoms.", debrief.getBreakthroughMoment());
        assertEquals(50, debrief.getStrategyBreakdown().get("PROBING"));
        assertEquals(2, debrief.getStrengths().size());
        assertEquals(1, debrief.getGrowthOpportunities().size());
        assertNotNull(debrief.getStudentOutcomes());
        assertTrue(debrief.getStudentOutcomes().containsKey("Sue"));
    }

    @Test
    @DisplayName("Parse valid multi-student debrief JSON with trajectory outcomes and equity")
    void testParseMultiStudentDebriefJson() {
        Student marcus = Student.builder().id(UUID.randomUUID()).name("Marcus").participationWeight(40).build();
        Student lena = Student.builder().id(UUID.randomUUID()).name("Lena").participationWeight(20).build();
        Student sue = Student.builder().id(UUID.randomUUID()).name("Sue").participationWeight(40).build();

        StudentMentalModel marcusModel = StudentMentalModel.builder().initialState(StudentState.CONFIDENTLY_WRONG).build();
        StudentMentalModel lenaModel = StudentMentalModel.builder().initialState(StudentState.CONFIDENTLY_WRONG).build();
        StudentMentalModel sueModel = StudentMentalModel.builder().initialState(StudentState.CONFIDENTLY_WRONG).build();

        SessionParticipant pMarcus = SessionParticipant.builder()
                .student(marcus)
                .mentalModel(marcusModel)
                .currentState(StudentState.CONFUSED)
                .turnsSpoken(4)
                .build();

        SessionParticipant pLena = SessionParticipant.builder()
                .student(lena)
                .mentalModel(lenaModel)
                .currentState(StudentState.UNDERSTANDING)
                .turnsSpoken(2)
                .build();

        SessionParticipant pSue = SessionParticipant.builder()
                .student(sue)
                .mentalModel(sueModel)
                .currentState(StudentState.UNDERSTANDING)
                .turnsSpoken(4)
                .build();

        List<SessionParticipant> participants = List.of(pMarcus, pLena, pSue);
        Map<String, Integer> equity = Map.of("Marcus", 40, "Lena", 20, "Sue", 40);

        String json = """
            {
              "summary": "Superb orchestration of multi-student discourse.",
              "breakthroughMoment": "The class connected Anthony's exposure to Sam to the incubation period.",
              "classroomManagementAdvice": "Great balance drawing in Lena while managing Marcus's excitement.",
              "strategyBreakdown": {
                "PROBING": 45,
                "GUIDED_DISCOVERY": 40,
                "TELLING": 15
              },
              "strengths": [
                "Elicited multiple perspectives before validating conclusions.",
                "Encouraged Lena to share her observations."
              ],
              "growthOpportunities": [
                "Ask students to critique each other's reasoning directly."
              ],
              "studentOutcomes": {
                "Marcus": {
                  "breakthroughMoment": "Marcus questioned if tiredness alone could create viruses.",
                  "masteryAchieved": false
                },
                "Lena": {
                  "breakthroughMoment": "Lena identified the shared project days before the game as the key event.",
                  "masteryAchieved": true
                },
                "Sue": {
                  "breakthroughMoment": "Sue articulated how the 3-day incubation period explains the symptoms delay.",
                  "masteryAchieved": true
                }
              }
            }
            """;

        DebriefData debrief = evaluator.parseMultiStudentDebriefResponse(
                json, participants, List.of(), equity, true
        );

        assertNotNull(debrief);
        assertTrue(debrief.isMasteryAchieved());
        assertEquals("Superb orchestration of multi-student discourse.", debrief.getSummary());
        assertEquals("Great balance drawing in Lena while managing Marcus's excitement.", debrief.getClassroomManagementAdvice());
        assertEquals(40, debrief.getEquityBreakdown().get("Marcus"));
        assertEquals(20, debrief.getEquityBreakdown().get("Lena"));
        assertEquals(40, debrief.getEquityBreakdown().get("Sue"));

        assertEquals(3, debrief.getStudentOutcomes().size());
        DebriefData.StudentOutcome marcusOutcome = debrief.getStudentOutcomes().get("Marcus");
        assertEquals(StudentState.CONFIDENTLY_WRONG, marcusOutcome.getInitialState());
        assertEquals(StudentState.CONFUSED, marcusOutcome.getFinalState());
        assertFalse(marcusOutcome.isMasteryAchieved());

        DebriefData.StudentOutcome lenaOutcome = debrief.getStudentOutcomes().get("Lena");
        assertEquals(StudentState.CONFIDENTLY_WRONG, lenaOutcome.getInitialState());
        assertEquals(StudentState.UNDERSTANDING, lenaOutcome.getFinalState());
        assertTrue(lenaOutcome.isMasteryAchieved());

        DebriefData.StudentOutcome sueOutcome = debrief.getStudentOutcomes().get("Sue");
        assertEquals(StudentState.CONFIDENTLY_WRONG, sueOutcome.getInitialState());
        assertEquals(StudentState.UNDERSTANDING, sueOutcome.getFinalState());
        assertTrue(sueOutcome.isMasteryAchieved());
    }

    @Test
    @DisplayName("Compute attention equity correctly from dialogue messages")
    void testComputeEquityBreakdown() {
        Student marcus = Student.builder().name("Marcus").build();
        Student lena = Student.builder().name("Lena").build();
        Student sue = Student.builder().name("Sue").build();

        SessionParticipant p1 = SessionParticipant.builder().student(marcus).build();
        SessionParticipant p2 = SessionParticipant.builder().student(lena).build();
        SessionParticipant p3 = SessionParticipant.builder().student(sue).build();

        List<Message> messages = List.of(
                Message.builder().senderType(SenderType.STUDENT).student(marcus).build(),
                Message.builder().senderType(SenderType.STUDENT).student(marcus).build(),
                Message.builder().senderType(SenderType.STUDENT).student(lena).build(),
                Message.builder().senderType(SenderType.STUDENT).student(sue).build()
        );

        Map<String, Integer> equity = evaluator.computeEquityBreakdown(List.of(p1, p2, p3), messages);

        assertEquals(50, equity.get("Marcus")); // 2 of 4 = 50%
        assertEquals(25, equity.get("Lena"));   // 1 of 4 = 25%
        assertEquals(25, equity.get("Sue"));    // 1 of 4 = 25%
    }

    @Test
    @DisplayName("Multi-student fallback debrief is generated gracefully on malformed JSON")
    void testMultiStudentFallbackOnMalformedJson() {
        Student marcus = Student.builder().name("Marcus").build();
        Student lena = Student.builder().name("Lena").build();

        SessionParticipant pMarcus = SessionParticipant.builder()
                .student(marcus)
                .currentState(StudentState.CONFIDENTLY_WRONG)
                .turnsSpoken(3)
                .build();

        SessionParticipant pLena = SessionParticipant.builder()
                .student(lena)
                .currentState(StudentState.UNDERSTANDING)
                .turnsSpoken(1)
                .build();

        DebriefData debrief = evaluator.parseMultiStudentDebriefResponse(
                "Malformed JSON response",
                List.of(pMarcus, pLena),
                List.of(),
                Map.of("Marcus", 75, "Lena", 25),
                true
        );

        assertNotNull(debrief);
        assertTrue(debrief.isMasteryAchieved());
        assertEquals(2, debrief.getStudentOutcomes().size());
        assertTrue(debrief.getStudentOutcomes().get("Lena").isMasteryAchieved());
        assertFalse(debrief.getStudentOutcomes().get("Marcus").isMasteryAchieved());
        assertNotNull(debrief.getClassroomManagementAdvice());
    }

    @Test
    @DisplayName("Fallback debrief is generated gracefully on malformed single-student JSON")
    void testFallbackOnMalformedJson() {
        DebriefData debrief = evaluator.parseDebriefResponse("Not valid json at all", StudentState.CONFUSED, 4, "Sue", false);

        assertNotNull(debrief);
        assertFalse(debrief.isMasteryAchieved());
        assertEquals(StudentState.CONFUSED, debrief.getFinalStudentState());
        assertEquals(4, debrief.getTotalTurns());
        assertNotNull(debrief.getStrategyBreakdown());
        assertFalse(debrief.getStrengths().isEmpty());
    }
}
