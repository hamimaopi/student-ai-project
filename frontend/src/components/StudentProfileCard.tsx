import React from 'react';
import { SessionParticipant, StudentState } from '../types';

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
    <div
      id="student-profile-card"
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Avatar with dynamic glow */}
        <div style={{ position: 'relative' }}>
          <img
            src={participant.avatarUrl || '/images/avatar_sue.jpg'}
            alt={participant.studentName}
            className={isThinking ? 'animate-thinking-glow' : ''}
            style={{
              width: '76px',
              height: '76px',
              borderRadius: 'var(--radius-xl)',
              objectFit: 'cover',
              border: isThinking
                ? '2.5px solid #fbbf24'
                : '2px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              transition: 'all var(--transition-normal)'
            }}
          />
          {isThinking && (
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: '#fbbf24',
                color: '#000',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                padding: '2px 6px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              THINKING
            </span>
          )}
        </div>

        {/* Student Name & Bio */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
              {participant.studentName}
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)'
              }}
            >
              8th Grade
            </span>
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              marginTop: '4px'
            }}
          >
            {participant.personality || 'Neurodiverse 8th grader learning science. Thoughtful and occasionally hesitant.'}
          </p>
        </div>
      </div>

      {/* Mental Model Stage */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          border: '1px solid var(--glass-border)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Mental Model State
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {participant.turnsInState} turn{participant.turnsInState === 1 ? '' : 's'} in state
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className={`state-badge state-${participant.currentState}`}>
            <span>{stateInfo.icon}</span>
            <span>{stateInfo.label}</span>
          </span>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
          {stateInfo.explanation}
        </p>

        {participant.stateSummary && (
          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)'
            }}
          >
            <strong>Pedagogical summary:</strong> {participant.stateSummary}
          </div>
        )}
      </div>
    </div>
  );
};
