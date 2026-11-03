package com.studentai.project.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    Optional<Student> findByNameIgnoreCase(String name);

    @Query(value = """
        SELECT s.* FROM student s
        JOIN classroom_student cs ON s.id = cs.student_id
        WHERE cs.classroom_id = :classroomId
        ORDER BY s.name ASC
    """, nativeQuery = true)
    List<Student> findByClassroomId(@Param("classroomId") UUID classroomId);
}
