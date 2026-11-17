package com.studentai.project.student;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String personality;

    @Column(name = "grade_level", nullable = false, length = 20)
    private String gradeLevel;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "participation_weight", nullable = false)
    @Builder.Default
    private Integer participationWeight = 40;

    @Column(name = "speaking_style", columnDefinition = "TEXT")
    private String speakingStyle;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
