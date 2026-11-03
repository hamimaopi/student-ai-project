-- ============================================================================
-- V2__classroom_schema.sql
-- Create core tables for Classrooms, Students, Scenarios, Sessions, and Messages
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TEACHER
CREATE TABLE IF NOT EXISTS teacher (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    avatar_badge  VARCHAR(50)  NOT NULL DEFAULT 'fox',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. CLASSROOM
CREATE TABLE IF NOT EXISTS classroom (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject       VARCHAR(50)  NOT NULL, -- 'SCIENCE', 'MATH', 'LITERACY'
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. STUDENT
CREATE TABLE IF NOT EXISTS student (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(50)  NOT NULL,
    personality   TEXT         NOT NULL,
    grade_level   VARCHAR(20)  NOT NULL,
    avatar_url    VARCHAR(255),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. CLASSROOM_STUDENT (Enrollment)
CREATE TABLE IF NOT EXISTS classroom_student (
    classroom_id  UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    student_id    UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (classroom_id, student_id)
);

-- 5. SCENARIO
CREATE TABLE IF NOT EXISTS scenario (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id     UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    title            VARCHAR(150) NOT NULL,
    description      TEXT NOT NULL,
    is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STUDENT_MENTAL_MODEL
CREATE TABLE IF NOT EXISTS student_mental_model (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id         UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    wrong_belief        TEXT NOT NULL,
    why_it_feels_right  TEXT NOT NULL,
    defenses            JSONB NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_student_mental_model UNIQUE (scenario_id, student_id)
);

-- 7. SESSION
CREATE TABLE IF NOT EXISTS session (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id    UUID REFERENCES teacher(id) ON DELETE SET NULL,
    classroom_id  UUID NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
    scenario_id   UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at      TIMESTAMPTZ
);

-- 8. SESSION_PARTICIPANT
CREATE TABLE IF NOT EXISTS session_participant (
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

-- 9. MESSAGE
CREATE TABLE IF NOT EXISTS message (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    sender_type   VARCHAR(20) NOT NULL,
    student_id    UUID REFERENCES student(id) ON DELETE SET NULL,
    content       TEXT NOT NULL,
    turn_number   INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_message_sender CHECK (
        (sender_type = 'TEACHER' AND student_id IS NULL) OR
        (sender_type = 'STUDENT' AND student_id IS NOT NULL)
    )
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_message_session_turn ON message(session_id, turn_number ASC);
CREATE INDEX IF NOT EXISTS idx_session_started_at ON session(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_teacher ON session(teacher_id);
CREATE INDEX IF NOT EXISTS idx_session_participant_session ON session_participant(session_id);
CREATE INDEX IF NOT EXISTS idx_scenario_classroom ON scenario(classroom_id);
CREATE INDEX IF NOT EXISTS idx_mental_model_scenario ON student_mental_model(scenario_id);
