# Science Classroom — End-to-End Flow & Sequence Diagrams

> 💡 **How to view these diagrams in the IDE:**  
> Press **`Cmd + Shift + V`** (macOS) or click the **"Open Preview to the Side"** icon (split window icon in the top-right corner of the editor) to render the visual diagrams.  
> Alternatively, open the interactive browser viewer: [**`flow diagrams/science/index.html`**](file:///Users/sanket/Desktop/Opi%20/student-ai-project/flow%20diagrams/science/index.html)

This directory contains the complete end-to-end flow and sequence diagrams for the **Science Classroom** module in Student AI. It visualizes the entire system lifecycle across the React frontend, Spring Boot backend, PostgreSQL persistence, and Ollama (`llama3.1:8b`) dual-prompt pipeline.

---

## 1. High-Level Architecture Flowchart

The diagram below illustrates how data and control flow across the system during a teaching session.

```mermaid
flowchart TD
    subgraph Client [Frontend - React 19 and TypeScript]
        UI_Home[Home and Teacher Setup View]
        UI_Classroom[Live Science Classroom View]
        UI_Chat[Interactive Chat Stream]
        UI_StudentCard[Sue Mental State Card]
        UI_Debrief[Pedagogical Debrief Modal]
        UI_Past[Past Conversations Modal]
    end

    subgraph Backend [Backend - Spring Boot 3.5]
        C_Classroom[ClassroomController]
        C_Session[SessionController]
        C_Chat[ChatController]
        
        S_Chat[ChatService]
        S_Session[SessionService]
        
        Evaluator[TransitionEvaluator - Spring AI Prompt 1]
        SM[StateTransitionEngine - Deterministic Rules]
        Generator[StudentResponseGenerator - Spring AI Prompt 2]
        DebriefEval[DebriefEvaluator - Spring AI Prompt 3]
    end

    subgraph LocalAI [Local AI Service - Ollama]
        Ollama[Ollama Engine - llama3.1 8b]
    end

    subgraph Database [PostgreSQL 16]
        DB_Classroom[(classrooms and scenarios)]
        DB_Student[(students and mental models)]
        DB_Session[(sessions and participants)]
        DB_Messages[(messages)]
    end

    %% Setup Flow
    UI_Home -->|1. Setup| C_Classroom
    C_Classroom --> DB_Classroom
    UI_Home -->|2. Start Session| C_Session
    C_Session --> S_Session
    S_Session --> DB_Session
    S_Session --> UI_Classroom

    %% Chat Loop Flow
    UI_Chat -->|3. Send Message| C_Chat
    C_Chat --> S_Chat
    S_Chat -->|Store Teacher Msg| DB_Messages
    S_Chat -->|Analyze Teacher Move| Evaluator
    Evaluator -->|JSON Eval Prompt| Ollama
    Ollama -->|Strategy and Recommendation| Evaluator
    Evaluator --> SM
    SM -->|Next Mental State| S_Chat
    S_Chat -->|Update Participant State| DB_Session
    S_Chat -->|Generate Persona Reply| Generator
    Generator -->|Student Prompt and History| Ollama
    Ollama -->|Sue Dialogue Reply| Generator
    Generator --> S_Chat
    S_Chat -->|Store Student Msg| DB_Messages
    S_Chat -->|Reply and Updated State| UI_Chat
    UI_Chat --> UI_StudentCard

    %% Debrief Flow
    UI_Classroom -->|4. End Session| C_Session
    C_Session --> S_Session
    S_Session --> DebriefEval
    DebriefEval -->|Analyze Full Transcript| Ollama
    Ollama -->|Debrief Report JSON| DebriefEval
    DebriefEval -->|Save JSONB debrief| DB_Session
    S_Session --> UI_Debrief

    %% Past Conversations Flow
    UI_Past -->|5. View History| C_Session
    C_Session --> DB_Session
    C_Session --> DB_Messages
```

---

## 2. Complete End-to-End Sequence Diagram

This sequence diagram details every message exchange, database query, and LLM prompt call from initial setup to debrief assessment.

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Teacher
    participant Web as React Frontend
    participant API as Spring Boot API
    participant ChatSvc as ChatService
    participant LLM_Eval as TransitionEvaluator
    participant StateEngine as StateTransitionEngine
    participant LLM_Student as StudentResponseGenerator
    participant DB as PostgreSQL DB

    %% 1. Session Setup
    Note over Teacher, DB: Phase 1: Setup and Session Creation
    Teacher->>Web: Selects Science tab, enters Teacher Name, picks Avatar Badge
    Web->>API: POST /api/sessions (classroomId, scenarioId, teacherName, badge)
    API->>DB: INSERT INTO sessions and session_participants (currentState: CONFIDENTLY_WRONG)
    DB-->>API: Created session record
    API-->>Web: 201 Created SessionData
    Web-->>Teacher: Live Science Classroom ready (Turn 0, State: Confidently Wrong)

    %% 2. Teacher Message & Dual-LLM Pipeline
    Note over Teacher, DB: Phase 2: Teacher Message and Dual-LLM Processing Loop
    Teacher->>Web: Submits question: What do you think made Anthony sick?
    Web->>Web: Optimistically append Teacher message to Chat UI, set thinking true
    Web->>API: POST /api/chat/messages (sessionId, content, studentId)
    API->>ChatSvc: handleTeacherMessage(sessionId, content, studentId)
    ChatSvc->>DB: INSERT INTO messages (sender: TEACHER, turnNumber: 1)

    %% 3. Pedagogical Evaluation Prompt
    Note over ChatSvc, LLM_Eval: Step 2A: Pedagogical Move Evaluation (Ollama llama3.1:8b)
    ChatSvc->>LLM_Eval: evaluateTransition(currentState, teacherMsg, scenario, history)
    LLM_Eval->>API: Prompt Ollama to evaluate teacher move
    Note over LLM_Eval: Classify: strategy (PROBING / DISCOVERY / TELLING)<br/>Classify: recommendation (ADVANCE / HOLD / REGRESS)
    API-->>LLM_Eval: Strategy PROBING, Recommendation ADVANCE
    LLM_Eval-->>ChatSvc: EvaluationResult(PROBING, ADVANCE)

    %% 4. State Machine Transition
    Note over ChatSvc, StateEngine: Step 2B: State Transition Engine
    ChatSvc->>StateEngine: computeNextState(CONFIDENTLY_WRONG, PROBING, ADVANCE)
    Note over StateEngine: Deterministic pedagogical transition:<br/>CONFIDENTLY_WRONG + PROBING + ADVANCE -> CONFUSED
    StateEngine-->>ChatSvc: nextState = CONFUSED, changed = true
    ChatSvc->>DB: UPDATE session_participants SET current_state = CONFUSED, turns_in_state = 1
    ChatSvc->>DB: UPDATE sessions SET turn_count = turn_count + 2

    %% 5. Persona Student Generation Prompt
    Note over ChatSvc, LLM_Student: Step 2C: Persona Student Generation (Ollama llama3.1:8b)
    ChatSvc->>LLM_Student: generateResponse(Sue, currentState: CONFUSED, teacherMsg, history)
    LLM_Student->>API: Prompt Ollama: Embody Sue (8th grader, hesitant, thoughtful)
    API-->>LLM_Student: Persona response reflecting confusion about Sam vs basketball
    LLM_Student-->>ChatSvc: Sue Persona Reply

    %% 6. Persistence & UI Sync
    ChatSvc->>DB: INSERT INTO messages (sender: STUDENT, turnNumber: 2)
    ChatSvc-->>API: SendMessageResponse(reply, participantState)
    API-->>Web: 200 OK
    Web->>Web: Set thinking false, append Sue reply, update state card to Confused
    Web-->>Teacher: Sue hesitant response appears on screen

    %% 7. Lesson Completion & Debrief
    Note over Teacher, DB: Phase 3: Lesson Debrief Generation
    alt Mastery Achieved (State = UNDERSTANDING) or Teacher clicks End Lesson
        Teacher->>Web: Clicks End Lesson in Navbar
        Web->>API: POST /api/sessions/id/end
        API->>ChatSvc: endSession(sessionId)
        ChatSvc->>LLM_Eval: Call DebriefEvaluator with full transcript
        LLM_Eval->>API: Prompt Ollama for multi-turn pedagogical coaching analysis
        API-->>LLM_Eval: Debrief JSON (summary, strategyBreakdown, breakthrough, tips)
        ChatSvc->>DB: UPDATE sessions SET ended_at = NOW(), debrief = JSONB
        ChatSvc-->>API: SessionData with Debrief
        API-->>Web: 200 OK
        Web-->>Teacher: Display DebriefModal with strategy breakdown and coaching advice
    end
```

---

## 3. Sue's Cognitive State Machine (`StudentMentalModel`)

The science scenario models an 8th-grade student ("Sue") moving from a common intuitive misconception (*"Anthony got sick because he got exhausted playing basketball in the cold"*) to scientific causality (*"Anthony was infected with a cold virus transmitted from Sam, which had an incubation delay"*).

```mermaid
stateDiagram-v2
    [*] --> CONFIDENTLY_WRONG

    CONFIDENTLY_WRONG --> CONFIDENTLY_WRONG: Direct correction reinforces defense
    CONFIDENTLY_WRONG --> DEFENSIVE: Blunt assertion of error
    CONFIDENTLY_WRONG --> CONFUSED: Socratic probing on evidence

    DEFENSIVE --> DEFENSIVE: Continued confrontation
    DEFENSIVE --> CONFUSED: Empathetic reframe
    DEFENSIVE --> CONFIDENTLY_WRONG: Abandoning inquiry

    CONFUSED --> DEFENSIVE: Harsh correction
    CONFUSED --> CONFUSED: Ambiguous guidance
    CONFUSED --> TENTATIVELY_CORRECT: Guided discovery clue

    TENTATIVELY_CORRECT --> CONFUSED: Overly complex explanation
    TENTATIVELY_CORRECT --> TENTATIVELY_CORRECT: Open clarification probe
    TENTATIVELY_CORRECT --> UNDERSTANDING: Incubation inquiry

    UNDERSTANDING --> [*]
```

---

## 4. Key Components and Responsibilities

| Component | Technology | Primary Responsibility |
|---|---|---|
| `TeacherSetupView` | React / TS | Hero banner, teacher identity selection, classroom subject picker (`Science`, `Math`). |
| `ClassroomView` | React / TS | Two-column live interactive classroom layout, toolbar controls, debrief modal management. |
| `StudentProfileCard` | React / TS | Real-time visual indicator of Sue's mental state, bio, thinking animation, turn count in state. |
| `ChatMessages` & `ChatInput` | React / TS | Live dialogue stream with role badges, auto-scroll, and teacher prompt dispatch. |
| `DebriefModal` | React / TS | Pedagogical coaching modal showing teaching strategy % (Probing, Discovery, Telling), turning points, and tips. |
| `PastConversationsModal` | React / TS | Searchable multi-tiered dialog for filtering past sessions by classroom and teacher. |
| `ChatService` | Spring Boot | Coordinates message persistence, evaluation call, state machine transition, and response generation. |
| `TransitionEvaluator` | Spring AI | Prompts Ollama with teacher message and rubric to classify strategy and transition recommendation. |
| `StateTransitionEngine` | Java / Core | Pure deterministic state machine determining state transitions based on pedagogical rules. |
| `StudentResponseGenerator` | Spring AI | Prompts Ollama to roleplay Sue adhering to persona constraints (hesitant, 8th grade voice, current state). |
| `DebriefEvaluator` | Spring AI | Evaluates completed session dialogue to compute pedagogical analytics and personalized growth tips. |
| `PostgreSQL 16` | PostgreSQL / Flyway | Stores structured relational data (`classrooms`, `scenarios`, `students`, `sessions`, `messages`) with JSONB debrief. |
