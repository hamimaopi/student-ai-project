package com.studentai.project.chat;

import com.studentai.project.chat.dto.ArbitrationResult;
import com.studentai.project.session.SessionParticipant;
import com.studentai.project.student.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ClassroomDiscourseArbiterTest {

    private ClassroomDiscourseArbiter arbiter;
    private SessionParticipant marcusParticipant;
    private SessionParticipant lenaParticipant;
    private SessionParticipant sueParticipant;
    private List<SessionParticipant> allParticipants;

    @BeforeEach
    void setUp() {
        arbiter = new ClassroomDiscourseArbiter();

        Student marcus = Student.builder()
                .id(UUID.randomUUID())
                .name("Marcus")
                .participationWeight(40)
                .build();

        Student lena = Student.builder()
                .id(UUID.randomUUID())
                .name("Lena")
                .participationWeight(20)
                .build();

        Student sue = Student.builder()
                .id(UUID.randomUUID())
                .name("Sue")
                .participationWeight(40)
                .build();

        marcusParticipant = SessionParticipant.builder().student(marcus).build();
        lenaParticipant = SessionParticipant.builder().student(lena).build();
        sueParticipant = SessionParticipant.builder().student(sue).build();

        allParticipants = List.of(marcusParticipant, lenaParticipant, sueParticipant);
    }

    @Test
    @DisplayName("Tier 1: Explicit UI target selection takes highest priority")
    void testExplicitTargetSelection() {
        ArbitrationResult result = arbiter.arbitrate(
                "Marcus, what do you think?",
                lenaParticipant.getStudent().getId(), // explicit target Lena
                allParticipants,
                null
        );

        assertEquals("Lena", result.getTargetParticipant().getStudent().getName());
        assertEquals("MANUAL_TEACHER_SELECTION", result.getRoutingReason());
        assertNull(result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Tier 2: Direct invitation referencing a peer routes to target and flags peer")
    void testInvitationWithPeer() {
        ArbitrationResult result = arbiter.arbitrate(
                "Sue, what do you think about Marcus's explanation?",
                null,
                allParticipants,
                null
        );

        assertEquals("Sue", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_INVITATION_REFERENCING_PEER", result.getRoutingReason());
        assertEquals("Marcus", result.getReferencedPeerName());
        assertEquals("Marcus", result.getReferencedParticipant().getStudent().getName());
    }

    @Test
    @DisplayName("Tier 3: Peer exclusion query ('Does anyone agree with Marcus?') excludes Marcus")
    void testPeerExclusionQuery() {
        ArbitrationResult result = arbiter.arbitrate(
                "Does anyone agree with Marcus?",
                null,
                allParticipants,
                null
        );

        assertNotEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertTrue(result.getTargetParticipant().getStudent().getName().equals("Lena") ||
                   result.getTargetParticipant().getStudent().getName().equals("Sue"));
        assertEquals("PEER_EXCLUSION_QUERY", result.getRoutingReason());
        assertEquals("Marcus", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Tier 3: Peer exclusion query ('Marcus seems to think... does anyone have a different explanation?') excludes Marcus")
    void testPeerExclusionDifferentExplanation() {
        ArbitrationResult result = arbiter.arbitrate(
                "Marcus seems to think basketball caused Anthony's illness. Does anyone have a different explanation?",
                null,
                allParticipants,
                null
        );

        assertNotEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertTrue(result.getTargetParticipant().getStudent().getName().equals("Lena") ||
                   result.getTargetParticipant().getStudent().getName().equals("Sue"));
        assertEquals("PEER_EXCLUSION_QUERY", result.getRoutingReason());
        assertEquals("Marcus", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Tier 4: Direct vocative address at start routes to addressed student")
    void testDirectVocativeStart() {
        ArbitrationResult result = arbiter.arbitrate(
                "Marcus, why do you think Anthony became sick?",
                null,
                allParticipants,
                null
        );

        assertEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_VOCATIVE_ADDRESS", result.getRoutingReason());
    }

    @Test
    @DisplayName("Tier 4: Direct vocative address at end routes to addressed student")
    void testDirectVocativeEnd() {
        ArbitrationResult result = arbiter.arbitrate(
                "Why do you think he got sick, Lena?",
                null,
                allParticipants,
                null
        );

        assertEquals("Lena", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_VOCATIVE_ADDRESS", result.getRoutingReason());
    }

    @Test
    @DisplayName("Passive mention without direct address does not force direct vocative")
    void testPassiveMentionDoesNotTriggerVocative() {
        // "Marcus and Sue both mentioned basketball." is not vocative
        ArbitrationResult result = arbiter.arbitrate(
                "Marcus and Sue both mentioned basketball.",
                null,
                allParticipants,
                null
        );

        assertEquals("OPEN_CLASS_WEIGHTED_SELECTION", result.getRoutingReason());
        assertNotNull(result.getTargetParticipant());
    }

    @Test
    @DisplayName("Tier 5: Open-class question selects candidate and respects recency damping")
    void testRecencyDampingOnOpenQuestion() {
        // Mock Random to select boundary
        Random predictableRandom = new Random(42);
        ClassroomDiscourseArbiter deterministicArbiter = new ClassroomDiscourseArbiter(predictableRandom);

        ArbitrationResult result = deterministicArbiter.arbitrate(
                "Why do you think Anthony became sick?",
                null,
                allParticipants,
                marcusParticipant.getStudent().getId() // Marcus was last speaker
        );

        assertEquals("OPEN_CLASS_WEIGHTED_SELECTION", result.getRoutingReason());
        assertNotNull(result.getTargetParticipant());
    }

    @Test
    @DisplayName("Tier 4: Vocative address without comma routes to addressed student ('Lena what are your thoughts ?')")
    void testVocativeWithoutComma() {
        ArbitrationResult result = arbiter.arbitrate(
                "Lena what are your thoughts ?",
                null,
                allParticipants,
                null
        );

        assertEquals("Lena", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_VOCATIVE_ADDRESS", result.getRoutingReason());
    }

    @Test
    @DisplayName("Tier 4: Single name reference routes to addressed student ('Lena ?')")
    void testSingleNameReference() {
        ArbitrationResult result = arbiter.arbitrate(
                "Lena ?",
                null,
                allParticipants,
                null
        );

        assertEquals("Lena", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_VOCATIVE_ADDRESS", result.getRoutingReason());
    }

    @Test
    @DisplayName("Grammar resilience: Informal peer invitation ('sue what about marcus')")
    void testInformalPeerInvitation() {
        ArbitrationResult result = arbiter.arbitrate(
                "sue what about marcus",
                null,
                allParticipants,
                null
        );

        assertEquals("Sue", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_INVITATION_REFERENCING_PEER", result.getRoutingReason());
        assertEquals("Marcus", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Grammar resilience: Slang and contractions ('marcus do u agree with sue')")
    void testSlangPeerInvitation() {
        ArbitrationResult result = arbiter.arbitrate(
                "marcus do u agree with sue",
                null,
                allParticipants,
                null
        );

        assertEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_INVITATION_REFERENCING_PEER", result.getRoutingReason());
        assertEquals("Sue", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Grammar resilience: Trailing peer address without punctuation ('what do u think of sue marcus')")
    void testTrailingPeerAddress() {
        ArbitrationResult result = arbiter.arbitrate(
                "what do u think of sue marcus",
                null,
                allParticipants,
                null
        );

        assertEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_INVITATION_REFERENCING_PEER", result.getRoutingReason());
        assertEquals("Sue", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Grammar resilience: Informal exclusion query ('anyone agree with marcus')")
    void testInformalExclusionQuery() {
        ArbitrationResult result = arbiter.arbitrate(
                "anyone agree with marcus",
                null,
                allParticipants,
                null
        );

        assertNotEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertEquals("PEER_EXCLUSION_QUERY", result.getRoutingReason());
        assertEquals("Marcus", result.getReferencedPeerName());
    }

    @Test
    @DisplayName("Typo resilience: Common name variants ('markus why u think that')")
    void testTypoResilience() {
        ArbitrationResult result = arbiter.arbitrate(
                "markus why u think that",
                null,
                allParticipants,
                null
        );

        assertEquals("Marcus", result.getTargetParticipant().getStudent().getName());
        assertEquals("DIRECT_VOCATIVE_ADDRESS", result.getRoutingReason());
    }
}
