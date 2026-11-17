import React from 'react';
import { SessionParticipant, StudentState } from '../types';
import styles from './ClassroomRosterPanel.module.css';

interface Props {
  participants: SessionParticipant[];
  isThinking: boolean;
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
  thinkingStudentName?: string | null;
}

const STATE_CONFIG: Record<
  StudentState,
  { label: string; icon: string }
> = {
  CONFIDENTLY_WRONG: {
    label: 'Confidently Wrong',
    icon: '🔴'
  },
  DEFENSIVE: {
    label: 'Defensive',
    icon: '🟠'
  },
  CONFUSED: {
    label: 'Confused & Puzzled',
    icon: '🟡'
  },
  TENTATIVELY_CORRECT: {
    label: 'Tentatively Correct',
    icon: '🔵'
  },
  UNDERSTANDING: {
    label: 'Full Understanding',
    icon: '🟢'
  }
};

export const ClassroomRosterPanel: React.FC<Props> = ({
  participants,
  isThinking,
  selectedStudentId,
  onSelectStudent,
  thinkingStudentName
}) => {
  if (!participants || participants.length === 0) return null;

  return (
    <div id="classroom-roster-panel" className={`glass-panel ${styles.rosterContainer}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.titleRow}>
          <span className={styles.headerIcon}>👥</span>
          <h3 className={styles.title}>Classroom Roster</h3>
        </div>
        <span className={styles.countBadge}>
          {participants.length} Students
        </span>
      </div>

      <div className={styles.hintText}>
        Click a student card or use the toolbar below to directly call on them.
      </div>

      {/* Student Cards List */}
      <div className={styles.studentList}>
        {participants.map((p) => {
          const isSelected = selectedStudentId === p.studentId;
          const isThisStudentThinking =
            isThinking &&
            (selectedStudentId
              ? selectedStudentId === p.studentId
              : (thinkingStudentName && thinkingStudentName !== 'The class' && thinkingStudentName !== 'Class'
                  ? thinkingStudentName.toLowerCase() === p.studentName.toLowerCase()
                  : true));

          const stateInfo = STATE_CONFIG[p.currentState] || {
            label: p.currentState,
            icon: '⚪'
          };

          return (
            <div
              key={p.id}
              id={`roster-student-card-${p.studentName.toLowerCase()}`}
              className={`${styles.studentCard} ${isSelected ? styles.studentCardActive : ''}`}
              onClick={() => onSelectStudent?.(isSelected ? null : p.studentId)}
              title={`Click to ${isSelected ? 'clear manual call-on' : `call on ${p.studentName}`}`}
            >
              {/* Header row with avatar, name & call-on indicator */}
              <div className={styles.cardHeaderRow}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={p.avatarUrl || '/images/avatar_sue.png'}
                    alt={p.studentName}
                    className={`${styles.avatar} ${
                      isThisStudentThinking
                        ? `animate-thinking-glow ${styles.avatarThinking}`
                        : ''
                    }`}
                  />
                  {isThisStudentThinking && (
                    <span className={styles.thinkingBadge}>THINKING</span>
                  )}
                </div>

                <div className={styles.studentMetaCol}>
                  <div className={styles.nameRow}>
                    <div className={styles.nameGroup}>
                      <h4 className={styles.name}>{p.studentName}</h4>
                      {isSelected && (
                        <span className={styles.callOnIndicator}>🎯 Called On</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.personality} title={p.personality}>
                    {p.personality}
                  </div>
                </div>
              </div>

              {/* State section badge */}
              <div className={styles.stateSection}>
                <span className={`state-badge state-${p.currentState}`}>
                  <span>{stateInfo.icon}</span>
                  <span>{stateInfo.label}</span>
                </span>
                <span className={styles.turnsInStatePill}>
                  {p.turnsInState} turn{p.turnsInState === 1 ? '' : 's'} in state
                </span>
              </div>

              {/* Metrics footer: turns spoken and participation weight */}
              <div className={styles.metricsRow}>
                <div className={styles.metricItem}>
                  <span>Spoke:</span>
                  <span className={styles.metricValue}>
                    {p.turnsSpoken ?? 0} time{(p.turnsSpoken ?? 0) === 1 ? '' : 's'}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span>Target Weight:</span>
                  <span className={styles.metricValue}>
                    {p.participationWeight ? `${p.participationWeight}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
