package com.studentai.project.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    @Query("""
        SELECT DISTINCT s FROM Session s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.classroom
        LEFT JOIN FETCH s.scenario
        LEFT JOIN FETCH s.participants p
        LEFT JOIN FETCH p.student
        ORDER BY s.startedAt DESC
    """)
    List<Session> findAllWithDetails();

    @Query("""
        SELECT s FROM Session s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.classroom
        LEFT JOIN FETCH s.scenario
        LEFT JOIN FETCH s.participants p
        LEFT JOIN FETCH p.student
        WHERE s.id = :id
    """)
    Optional<Session> findByIdWithDetails(@Param("id") UUID id);
}
