-- ============================================================================
-- V3__seed_science_classroom.sql
-- Seed initial Science Classroom, Student (Sue), Scenario, and Mental Model
-- ============================================================================

-- 1. Seed Science Classroom
INSERT INTO classroom (id, subject, name, description)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SCIENCE',
    '8th Grade Life Science',
    'Middle school life science classroom focused on disease transmission, causal reasoning, and evidence-based science.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed AI Student (Sue)
INSERT INTO student (id, name, personality, grade_level, avatar_url)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'Sue',
    'Neurodiverse 8th grade student learning science. Thoughtful and occasionally hesitant. Occasionally uses ''maybe''. Do NOT start every sentence with ''Um''.',
    '8th Grade',
    '/images/avatar_sue.jpg'
) ON CONFLICT (id) DO NOTHING;

-- 3. Enroll Sue in Science Classroom
INSERT INTO classroom_student (classroom_id, student_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010'
) ON CONFLICT (classroom_id, student_id) DO NOTHING;

-- 4. Seed Disease Transmission Scenario
INSERT INTO scenario (id, classroom_id, title, description, is_ai_generated)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    'Disease Transmission: The Basketball Game',
    'Sam is in school with a sniffle. She works closely in class with Anthony. In a few days, Sam stays home in bed with a severe cold. A few days later, Anthony is playing in a basketball game. He feels tired and keeps missing shots. The coach takes him out and puts Rick in. Rick was sitting on the bench all season but plays great. The fans are delighted, but it’s too late and the team loses the game. The next day, Anthony feels miserable with a severe cold, and also stays home in bed.',
    false
) ON CONFLICT (id) DO NOTHING;

-- 5. Seed Sue's Mental Model (Misconception: Exhaustion caused the cold)
INSERT INTO student_mental_model (id, scenario_id, student_id, wrong_belief, why_it_feels_right, defenses)
VALUES (
    '00000000-0000-0000-0000-000000001000',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000010',
    'Anthony got sick because he was exhausted from playing basketball too hard. Physical tiredness directly caused the cold.',
    'He felt tired during the game and woke up sick the very next morning, so the physical exertion must have made him sick.',
    '["When you play sports hard, your body gets weak and catches colds.", "He was fine until the coach made him play so hard.", "He woke up sick the next morning right after the game, so it has to be the game."]'::jsonb
) ON CONFLICT (scenario_id, student_id) DO NOTHING;
