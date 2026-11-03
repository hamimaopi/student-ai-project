package com.studentai.project.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentMentalModelRepository extends JpaRepository<StudentMentalModel, UUID> {
    Optional<StudentMentalModel> findByScenarioIdAndStudentId(UUID scenarioId, UUID studentId);
}
