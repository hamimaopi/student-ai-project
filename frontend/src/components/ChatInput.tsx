import React, { useState, useRef, useEffect } from 'react';
import { StudentState } from '../types';
import styles from './ChatInput.module.css';

interface Props {
  onSendMessage: (content: string) => void;
  disabled: boolean;
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
  studentState = 'CONFIDENTLY_WRONG',
  studentName = 'Sue'
}) => {
  const [content, setContent] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeHintConfig = STATE_HINTS[studentState] || STATE_HINTS.CONFIDENTLY_WRONG;

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div id="chat-input-wrapper" className={styles.wrapper}>
      {/* Pedagogical Prompt Chips dynamically updating per student mental model */}
      <div key={studentState} className={`animate-fade-in ${styles.chipsBar}`}>
        <div
          className={styles.stateTagPill}
          style={{
            background: activeHintConfig.bgVar,
            color: activeHintConfig.colorVar,
            border: `1px solid ${activeHintConfig.colorVar}`
          }}
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
            className={styles.starterChip}
            style={{
              '--chip-hover-bg': activeHintConfig.bgVar,
              '--chip-hover-color': activeHintConfig.colorVar,
              '--chip-hover-border': activeHintConfig.colorVar
            } as React.CSSProperties}
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Main Form */}
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
            placeholder={disabled ? `${studentName} is reflecting on your question...` : `Guide ${studentName}'s thinking or ask a question... (Press Enter to send)`}
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
