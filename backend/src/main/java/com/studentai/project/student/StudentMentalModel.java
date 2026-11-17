package com.studentai.project.student;

import com.studentai.project.classroom.Scenario;
import com.studentai.project.statemachine.StudentState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "student_mental_model",
    uniqueConstraints = @UniqueConstraint(name = "uq_scenario_student_mental_model", columnNames = {"scenario_id", "student_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMentalModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "wrong_belief", nullable = false, columnDefinition = "TEXT")
    private String wrongBelief;

    @Column(name = "why_it_feels_right", nullable = false, columnDefinition = "TEXT")
    private String whyItFeelsRight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "defenses", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> defenses = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "initial_state", nullable = false, length = 30)
    @Builder.Default
    private StudentState initialState = StudentState.CONFIDENTLY_WRONG;

    @Column(name = "target_concept", columnDefinition = "TEXT")
    private String targetConcept;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
