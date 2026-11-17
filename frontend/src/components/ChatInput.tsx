import React, { useState, useRef, useEffect } from 'react';
import { SessionParticipant, StudentState } from '../types';
import styles from './ChatInput.module.css';

interface Props {
  onSendMessage: (content: string, targetStudentId?: string | null) => void;
  disabled: boolean;
  participants?: SessionParticipant[];
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
  studentState?: StudentState;
  studentName?: string;
}

interface StateHintConfig {
  tag: string;
  icon: string;
  colorVar: string;
  bgVar: string;
  starters: string[];
}

const OPEN_CLASS_HINTS: StateHintConfig = {
  tag: 'OPEN CLASSROOM INQUIRY',
  icon: '✨',
  colorVar: 'var(--accent-cyan)',
  bgVar: 'rgba(56, 189, 248, 0.15)',
  starters: [
    "Why do you think Anthony became sick?",
    "Does anyone agree that tiredness from basketball caused the cold?",
    "Could someone catch a cold virus days before noticing symptoms?",
    "Who remembers where Sam was sitting in class earlier that week?"
  ]
};

const STATE_HINTS: Record<StudentState, StateHintConfig> = {
  CONFIDENTLY_WRONG: {
    tag: 'PROBING MISCONCEPTION',
    icon: '🔴',
    colorVar: 'var(--state-confidently-wrong)',
    bgVar: 'var(--state-confidently-wrong-bg)',
    starters: [
      "What do you think happened to Anthony?",
      "Have you ever played sports and felt tired without catching a cold?",
      "Could something else have happened to Anthony before the game?",
      "Do you think being exhausted creates a virus, or do viruses come from people?"
    ]
  },
  DEFENSIVE: {
    tag: 'DE-ESCALATING',
    icon: '🟠',
    colorVar: 'var(--state-defensive)',
    bgVar: 'var(--state-defensive-bg)',
    starters: [
      "I hear you — what makes you feel so certain it was the basketball game?",
      "If basketball caused it, why didn't Rick or the other teammates get sick too?",
      "Could Anthony have already had a bug in his body before the game started?",
      "What if being tired just made him notice the sickness sooner?"
    ]
  },
  CONFUSED: {
    tag: 'GUIDING DISCOVERY',
    icon: '🟡',
    colorVar: 'var(--state-confused)',
    bgVar: 'var(--state-confused-bg)',
    starters: [
      "Think back to class: could working closely with Sam be connected?",
      "Do cold viruses make people sick instantly, or do they take time to multiply?",
      "Why do you think it took several days after sitting with Sam for Anthony to feel sick?",
      "Can someone have a cold virus inside them before they start sneezing?"
    ]
  },
  TENTATIVELY_CORRECT: {
    tag: 'SOLIDIFYING MECHANISM',
    icon: '🔵',
    colorVar: 'var(--state-tentatively-correct)',
    bgVar: 'var(--state-tentatively-correct-bg)',
    starters: [
      "Exactly! So what was happening inside Anthony between sitting with Sam and the game?",
      "How does the idea of an incubation period explain the delay in symptoms?",
      "What role did playing basketball play if the virus actually came from Sam?",
      "How would you explain the connection between Sam and Anthony in your own words?"
    ]
  },
  UNDERSTANDING: {
    tag: 'SYNTHESIS & MASTERY',
    icon: '🟢',
    colorVar: 'var(--state-understanding)',
    bgVar: 'var(--state-understanding-bg)',
    starters: [
      "You nailed it! How would you explain virus incubation to another student?",
      "Would Anthony still have gotten sick even if he had rested at home instead?",
      "Why is washing hands and staying home when sick so important for stopping viruses?",
      "Great scientific reasoning! Ready to review your debrief summary?"
    ]
  }
};

export const ChatInput: React.FC<Props> = ({
  onSendMessage,
  disabled,
  participants,
  selectedStudentId,
  onSelectStudent,
  studentState = 'CONFIDENTLY_WRONG',
  studentName = 'Sue'
}) => {
  const [content, setContent] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine active student context
  const targetParticipant = participants?.find((p) => p.studentId === selectedStudentId);
  const activeStudentName = targetParticipant ? targetParticipant.studentName : (selectedStudentId ? studentName : null);
  const activeStudentState = targetParticipant ? targetParticipant.currentState : studentState;

  const activeHintConfig = activeStudentName
    ? (STATE_HINTS[activeStudentState] || STATE_HINTS.CONFIDENTLY_WRONG)
    : OPEN_CLASS_HINTS;

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, selectedStudentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim(), selectedStudentId);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholderText = disabled
    ? (activeStudentName ? `${activeStudentName} is reflecting on your question...` : 'A student is reflecting on your question...')
    : (activeStudentName
        ? `Ask ${activeStudentName} a question or guide their thinking... (Press Enter to send)`
        : 'Ask a question to the class or call on a student... (Press Enter to send)');

  return (
    <div id="chat-input-wrapper" className={styles.wrapper}>
      {/* 1. Teacher Call-On Toolbar */}
      {participants && participants.length > 0 && (
        <div id="call-on-toolbar" className={styles.callOnToolbar}>
          <span className={styles.callOnLabel}>Call on:</span>

          <button
            id="call-on-auto-chip"
            type="button"
            disabled={disabled}
            onClick={() => onSelectStudent?.(null)}
            className={`${styles.callOnChip} ${selectedStudentId == null ? styles.callOnChipActive : ''}`}
            title="Automatically routes based on names in your message or open-class participation"
          >
            <span>✨</span>
            <span>Auto-Route</span>
          </button>

          {participants.map((p) => {
            const isSelected = selectedStudentId === p.studentId;
            return (
              <button
                key={p.studentId}
                id={`call-on-chip-${p.studentName.toLowerCase()}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelectStudent?.(isSelected ? null : p.studentId)}
                className={`${styles.callOnChip} ${isSelected ? styles.callOnChipActive : ''}`}
                title={`Target ${p.studentName} directly`}
              >
                <img
                  src={p.avatarUrl || '/images/avatar_sue.png'}
                  alt={p.studentName}
                  className={styles.callOnChipAvatar}
                />
                <span>{p.studentName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Pedagogical Prompt Chips dynamically updating per student mental model */}
      <div key={selectedStudentId || 'auto'} className={`animate-fade-in ${styles.chipsBar}`}>
        <div
          className={`${styles.stateTagPill} ${
            activeStudentName ? (styles[`tag_${activeStudentState}`] || styles.tag_OPEN) : styles.tag_OPEN
          }`}
        >
          <span>{activeHintConfig.icon}</span>
          <span>{activeHintConfig.tag}</span>
        </div>

        {activeHintConfig.starters.map((starter, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => {
              setContent(starter);
              textareaRef.current?.focus();
            }}
            className={`${styles.starterChip} ${
              activeStudentName ? (styles[`chip_${activeStudentState}`] || styles.chip_OPEN) : styles.chip_OPEN
            }`}
          >
            {starter}
          </button>
        ))}
      </div>

      {/* 3. Main Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={2}
            value={content}
            disabled={disabled}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className={styles.textarea}
          />
        </div>

        <button
          type="submit"
          id="chat-send-button"
          disabled={disabled || !content.trim()}
          className={`btn-primary ${styles.sendButton}`}
        >
          <span>Send</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};
