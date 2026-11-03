import React from 'react';
import { SessionParticipant, StudentState } from '../types';
import styles from './StudentProfileCard.module.css';

interface Props {
  participant?: SessionParticipant;
  isThinking: boolean;
}

const STATE_CONFIG: Record<
  StudentState,
  { label: string; icon: string; explanation: string }
> = {
  CONFIDENTLY_WRONG: {
    label: 'Confidently Wrong',
    icon: '🔴',
    explanation: 'Convinced that running hard in basketball made Anthony sick.'
  },
  DEFENSIVE: {
    label: 'Defensive',
    icon: '🟠',
    explanation: 'Pushing back against teacher hints and defending her theory.'
  },
  CONFUSED: {
    label: 'Confused & Puzzled',
    icon: '🟡',
    explanation: 'Questioning how cold viruses work and why Sam got sick first.'
  },
  TENTATIVELY_CORRECT: {
    label: 'Tentatively Correct',
    icon: '🔵',
    explanation: 'Connecting Sam to Anthony, testing incubation period cautiously.'
  },
  UNDERSTANDING: {
    label: 'Full Understanding',
    icon: '🟢',
    explanation: 'Understands transmission between people and incubation delay!'
  }
};

export const StudentProfileCard: React.FC<Props> = ({ participant, isThinking }) => {
  if (!participant) return null;

  const stateInfo = STATE_CONFIG[participant.currentState] || {
    label: participant.currentState,
    icon: '⚪',
    explanation: 'Listening to the teacher.'
  };

  return (
    <div id="student-profile-card" className={`glass-panel ${styles.card}`}>
      <div className={styles.headerRow}>
        {/* Avatar with dynamic glow */}
        <div className={styles.avatarWrapper}>
          <img
            src={participant.avatarUrl || '/images/avatar_sue.jpg'}
            alt={participant.studentName}
            className={`${styles.avatar} ${isThinking ? `animate-thinking-glow ${styles.avatarThinking}` : ''}`}
          />
          {isThinking && (
            <span className={styles.thinkingBadge}>
              THINKING
            </span>
          )}
        </div>

        {/* Student Name & Bio */}
        <div className={styles.bioCol}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>
              {participant.studentName}
            </h3>
            <span className={styles.gradeBadge}>
              8th Grade
            </span>
          </div>

          <p className={styles.personality}>
            {participant.personality || 'Neurodiverse 8th grader learning science. Thoughtful and occasionally hesitant.'}
          </p>
        </div>
      </div>

      {/* Mental Model Stage */}
      <div className={styles.mentalModelStateBox}>
        <div className={styles.stateBoxHeader}>
          <span className={styles.stateBoxTitle}>
            Mental Model State
          </span>
          <span className={styles.turnsInState}>
            {participant.turnsInState} turn{participant.turnsInState === 1 ? '' : 's'} in state
          </span>
        </div>

        <div className={styles.badgeRow}>
          <span className={`state-badge state-${participant.currentState}`}>
            <span>{stateInfo.icon}</span>
            <span>{stateInfo.label}</span>
          </span>
        </div>

        <p className={styles.explanation}>
          {stateInfo.explanation}
        </p>

        {participant.stateSummary && (
          <div className={styles.summaryFooter}>
            <strong>Pedagogical summary:</strong> {participant.stateSummary}
          </div>
        )}
      </div>
    </div>
  );
};
