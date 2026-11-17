package com.studentai.project.session;

import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import com.studentai.project.student.StudentMentalModel;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "session_participant",
    uniqueConstraints = @UniqueConstraint(name = "uq_session_student", columnNames = {"session_id", "student_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mental_model_id")
    private StudentMentalModel mentalModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 30)
    @Builder.Default
    private StudentState currentState = StudentState.CONFIDENTLY_WRONG;

    @Column(name = "turns_in_state", nullable = false)
    @Builder.Default
    private int turnsInState = 0;

    @Column(name = "turns_spoken", nullable = false)
    @Builder.Default
    private int turnsSpoken = 0;

    @Column(name = "last_spoke_at_turn")
    private Integer lastSpokeAtTurn;

    @Column(name = "state_summary", columnDefinition = "TEXT")
    private String stateSummary;

    public void incrementTurnsInState() {
        this.turnsInState++;
    }

    public void resetTurnsInState() {
        this.turnsInState = 0;
    }

    public void recordTurnSpoken(int turnNumber) {
        this.turnsSpoken++;
        this.lastSpokeAtTurn = turnNumber;
    }
}
