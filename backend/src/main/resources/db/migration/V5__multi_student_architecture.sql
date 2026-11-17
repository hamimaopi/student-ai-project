-- ============================================================================
-- V5__multi_student_architecture.sql
-- Upgrades schema to support 3-student classroom discourse and state analytics
-- ============================================================================

-- 1. Enhance student table with discourse weights and speaking style
ALTER TABLE student
ADD COLUMN IF NOT EXISTS participation_weight INT NOT NULL DEFAULT 40,
ADD COLUMN IF NOT EXISTS speaking_style TEXT;

-- 2. Enhance student_mental_model with initial_state and target concept
ALTER TABLE student_mental_model
ADD COLUMN IF NOT EXISTS initial_state VARCHAR(30) NOT NULL DEFAULT 'CONFIDENTLY_WRONG',
ADD COLUMN IF NOT EXISTS target_concept TEXT;

-- 3. Enhance session_participant with discourse statistics
ALTER TABLE session_participant
ADD COLUMN IF NOT EXISTS turns_spoken INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_spoke_at_turn INT;

-- 4. Enhance message with routing attribution and student state audit
ALTER TABLE message
ADD COLUMN IF NOT EXISTS target_student_id UUID REFERENCES student(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referenced_student_id UUID REFERENCES student(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS routing_reason VARCHAR(50),
ADD COLUMN IF NOT EXISTS student_state_snapshot VARCHAR(30);

-- 5. Seed Marcus and Lena into student table
INSERT INTO student (id, name, personality, grade_level, avatar_url, participation_weight, speaking_style)
VALUES 
    (
        '00000000-0000-0000-0000-000000000020',
        'Marcus',
        'Energetic, enthusiastic, and eager to participate. Most talkative student in the classroom. Wants the teacher''s attention and approval. Sometimes makes unexpected connections.',
        '8th Grade',
        '/images/avatar_marcus.png',
        40,
        'Speaks quickly with excitement, using exclamation points and eager phrases.'
    ),
    (
        '00000000-0000-0000-0000-000000000030',
        'Lena',
        'Quiet, observant, and responsible. The quietest student in the classroom. Takes assignments seriously. Doesn''t speak unless she has something meaningful to contribute. Sometimes struggles to keep up because she is tired or overwhelmed.',
        '8th Grade',
        '/images/avatar_lena.png',
        20,
        'Speaks hesitantly with careful punctuation, often pausing with ellipses.'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    personality = EXCLUDED.personality,
    grade_level = EXCLUDED.grade_level,
    avatar_url = EXCLUDED.avatar_url,
    participation_weight = EXCLUDED.participation_weight,
    speaking_style = EXCLUDED.speaking_style;

-- Update Sue's personality and attributes
UPDATE student
SET personality = 'Gifted and intellectually curious. Has strong opinions. Can become defensive when challenged. Makes connections and questions explanations.',
    participation_weight = 40,
    avatar_url = '/images/avatar_sue.png',
    speaking_style = 'Incisive, analytical, questions peer reasoning directly.'
WHERE id = '00000000-0000-0000-0000-000000000010';

-- 6. Enroll Marcus and Lena in the 8th Grade Science Classroom
INSERT INTO classroom_student (classroom_id, student_id)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030')
ON CONFLICT (classroom_id, student_id) DO NOTHING;

-- 7. Update Sue's mental model with initial_state and target_concept (Confidently Wrong)
UPDATE student_mental_model
SET initial_state = 'CONFIDENTLY_WRONG',
    wrong_belief = 'Anthony got sick because extreme athletic exhaustion crashed his immune system right after the game. Physical exertion directly triggered the cold.',
    why_it_feels_right = 'He was completely worn out, missing shots, and woke up sick the next morning, so the physical exhaustion created the illness.',
    target_concept = 'Distinction between physical fatigue and pathogen transmission via viral incubation.'
WHERE student_id = '00000000-0000-0000-0000-000000000010' 
  AND scenario_id = '00000000-0000-0000-0000-000000000100';

-- 8. Seed Marcus's mental model (Confidently Wrong)
INSERT INTO student_mental_model (id, scenario_id, student_id, wrong_belief, why_it_feels_right, defenses, initial_state, target_concept)
VALUES (
    '00000000-0000-0000-0000-000000002000',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000020',
    'Anthony got sick because he played basketball too hard in the cold gym. Physical tiredness directly caused the cold.',
    'He was running all over the court, missing shots, and sweating. That wears down your body and creates a cold.',
    '["When you run hard in sports, your immune system crashes and you get sick.", "He was fine until the coach made him play!", "If basketball didn''t cause it, why did he feel tired during the game?"]'::jsonb,
    'CONFIDENTLY_WRONG',
    'Distinction between correlation (tired during game) and causation (pathogen transmission).'
)
ON CONFLICT (scenario_id, student_id) DO UPDATE SET
    wrong_belief = EXCLUDED.wrong_belief,
    why_it_feels_right = EXCLUDED.why_it_feels_right,
    defenses = EXCLUDED.defenses,
    initial_state = EXCLUDED.initial_state,
    target_concept = EXCLUDED.target_concept;

-- 9. Seed Lena's mental model (Confidently Wrong)
INSERT INTO student_mental_model (id, scenario_id, student_id, wrong_belief, why_it_feels_right, defenses, initial_state, target_concept)
VALUES (
    '00000000-0000-0000-0000-000000003000',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000030',
    'Anthony caught the cold from the cold drafty air in the gym and sweating without resting. Going out or running in the cold causes colds directly.',
    'People always say you catch a cold when you are cold and sweating in a drafty gym.',
    '["My mom always tells me not to stay in sweaty clothes in the cold or you get sick.", "The gym was freezing and he was sweating!"]'::jsonb,
    'CONFIDENTLY_WRONG',
    'Distinction between environmental cold/sweat and viral pathogen transmission.'
)
ON CONFLICT (scenario_id, student_id) DO UPDATE SET
    wrong_belief = EXCLUDED.wrong_belief,
    why_it_feels_right = EXCLUDED.why_it_feels_right,
    defenses = EXCLUDED.defenses,
    initial_state = EXCLUDED.initial_state,
    target_concept = EXCLUDED.target_concept;
