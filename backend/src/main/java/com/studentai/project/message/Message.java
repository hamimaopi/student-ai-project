package com.studentai.project.message;

import com.studentai.project.session.Session;
import com.studentai.project.statemachine.StudentState;
import com.studentai.project.student.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SenderType senderType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_student_id")
    private Student targetStudent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referenced_student_id")
    private Student referencedStudent;

    @Column(name = "routing_reason", length = 50)
    private String routingReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "student_state_snapshot", length = 30)
    private StudentState studentStateSnapshot;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "turn_number", nullable = false)
    private int turnNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
