package com.studentai.project.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findBySessionIdOrderByTurnNumberAsc(UUID sessionId);

    @Query("SELECT COALESCE(MAX(m.turnNumber), 0) FROM Message m WHERE m.session.id = :sessionId")
    int findMaxTurnNumberBySessionId(@Param("sessionId") UUID sessionId);

    Optional<Message> findFirstBySessionIdOrderByTurnNumberDesc(UUID sessionId);
}
