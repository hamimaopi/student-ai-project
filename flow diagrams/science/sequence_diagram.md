# Science Classroom — Detailed Sequence Diagram

> 💡 **How to view this diagram in the IDE:**  
> Press **`Cmd + Shift + V`** (macOS) or click the **"Open Preview to the Side"** icon (split editor icon in the top-right corner of this tab) to render the visual sequence diagram.  
> Alternatively, open the interactive dashboard in your browser: [**`flow diagrams/science/index.html`**](file:///Users/sanket/Desktop/Opi%20/student-ai-project/flow%20diagrams/science/index.html)

---

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
