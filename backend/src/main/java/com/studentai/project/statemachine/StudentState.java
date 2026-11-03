package com.studentai.project.statemachine;

public enum StudentState {
    CONFIDENTLY_WRONG,
    DEFENSIVE,
    CONFUSED,
    TENTATIVELY_CORRECT,
    UNDERSTANDING;

    public boolean isTerminal() {
        return this == UNDERSTANDING;
    }
}
