-- ============================================================================
-- Student AI Project - Database DDL Schema (PostgreSQL)
-- ============================================================================

-- Ensure pgcrypto or uuid-ossp extension is enabled for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TEACHER
-- Lightweight profile for real users (no passwords/auth required).
-- ----------------------------------------------------------------------------
CREATE TABLE teacher (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    avatar_badge  VARCHAR(50)  NOT NULL DEFAULT 'fox', -- e.g., 'fox', 'otter', 'owl', 'panda'
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. CLASSROOM
-- Broad subject domains (Science, Math) and course containers.
-- ----------------------------------------------------------------------------
CREATE TABLE classroom (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject       VARCHAR(50)  NOT NULL, -- 'SCIENCE', 'MATH', 'LITERACY'
    name          VARCHAR(100) NOT NULL, -- e.g., '8th Grade Life Science'
    description   TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. STUDENT
-- Standalone AI personas (Sue, Marcus, Matty) with distinct personalities.
-- A student can attend multiple classrooms.
-- ----------------------------------------------------------------------------
CREATE TABLE student (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(50)  NOT NULL,
    personality   TEXT         NOT NULL,
    grade_level   VARCHAR(20)  NOT NULL, -- e.g., '8th Grade', '6th Grade'
    avatar_url    VARCHAR(255),          -- e.g., '/images/avatar_sue.jpg'
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. CLASSROOM_STUDENT (Enrollment Junction)
-- Allows a student (e.g. Sue) to belong to multiple classrooms (Science, Math).
-- ----------------------------------------------------------------------------
CREATE TABLE classroom_student (
    classroom_id  UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    student_id    UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (classroom_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 5. SCENARIO
-- Stories / problem statements discussed in a classroom.
-- Supports seeded scenarios as well as dynamic AI-generated ones.
-- ----------------------------------------------------------------------------
CREATE TABLE scenario (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id     UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    title            VARCHAR(150) NOT NULL,
    description      TEXT NOT NULL,
    is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. STUDENT_MENTAL_MODEL
-- Defines what a specific student believes wrong in a specific scenario,
-- why it feels right to them, and what defenses they use when challenged.
-- ----------------------------------------------------------------------------
CREATE TABLE student_mental_model (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id         UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    wrong_belief        TEXT NOT NULL,
    why_it_feels_right  TEXT NOT NULL,
    defenses            JSONB NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_student_mental_model UNIQUE (scenario_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 7. SESSION
-- A teaching interaction between 1 teacher, in 1 classroom, on 1 scenario.
-- ----------------------------------------------------------------------------
CREATE TABLE session (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id    UUID REFERENCES teacher(id) ON DELETE SET NULL,
    classroom_id  UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    scenario_id   UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at      TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 8. SESSION_PARTICIPANT
-- The live mental state of each student participating in a session.
-- Supports 1 or multiple students per session (e.g., Sue, Marcus, Lena).
-- ----------------------------------------------------------------------------
CREATE TABLE session_participant (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    student_id        UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    mental_model_id   UUID REFERENCES student_mental_model(id) ON DELETE SET NULL,
    current_state     VARCHAR(30) NOT NULL DEFAULT 'CONFIDENTLY_WRONG',
    turns_in_state    INT NOT NULL DEFAULT 0,
    state_summary     TEXT,
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id),
    CONSTRAINT chk_participant_state CHECK (
        current_state IN ('CONFIDENTLY_WRONG', 'DEFENSIVE', 'CONFUSED', 'TENTATIVELY_CORRECT', 'UNDERSTANDING')
    )
);

-- ----------------------------------------------------------------------------
-- 9. MESSAGE
-- Chronological ledger of all conversation turns in a session.
-- ----------------------------------------------------------------------------
CREATE TABLE message (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    sender_type   VARCHAR(20) NOT NULL, -- 'TEACHER' or 'STUDENT'
    student_id    UUID REFERENCES student(id) ON DELETE SET NULL, -- NULL if TEACHER
    content       TEXT NOT NULL,
    turn_number   INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_message_sender CHECK (
        (sender_type = 'TEACHER' AND student_id IS NULL) OR
        (sender_type = 'STUDENT' AND student_id IS NOT NULL)
    )
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX idx_message_session_turn ON message(session_id, turn_number ASC);
CREATE INDEX idx_session_started_at ON session(started_at DESC);
CREATE INDEX idx_session_teacher ON session(teacher_id);
CREATE INDEX idx_session_participant_session ON session_participant(session_id);
CREATE INDEX idx_scenario_classroom ON scenario(classroom_id);
CREATE INDEX idx_mental_model_scenario ON student_mental_model(scenario_id);
