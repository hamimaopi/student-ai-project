import React from 'react';
import { SessionData, StudentState, DebriefData } from '../types';
import { formatDuration, formatMessageTime } from '../utils/formatters';
import styles from './DebriefModal.module.css';

interface Props {
  session: SessionData;
  onClose: () => void;
  onRestart: () => void;
}

export const DebriefModal: React.FC<Props> = ({ session, onClose, onRestart }) => {
  const participant = session.participants?.[0];
  const currentState: StudentState = participant?.currentState || 'CONFIDENTLY_WRONG';
  const debrief: DebriefData | undefined | null = session.debrief;
  const achievedMastery = (debrief ? debrief.masteryAchieved : currentState === 'UNDERSTANDING');

  const strategyBreakdown = debrief?.strategyBreakdown || {
    PROBING: 50,
    GUIDED_DISCOVERY: 35,
    TELLING: 15
  };

  const probingPct = strategyBreakdown['PROBING'] || 0;
  const discoveryPct = strategyBreakdown['GUIDED_DISCOVERY'] || 0;
  const tellingPct = strategyBreakdown['TELLING'] || 0;

  return (
    <div id="debrief-modal-backdrop" className={styles.backdrop}>
      <div
        id="debrief-modal-card"
        className={`glass-panel animate-slide-up ${styles.modalCard} ${achievedMastery ? styles.modalCardMastery : ''}`}
      >
        {/* Header Badge & Title */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            {achievedMastery ? '🏆' : '📚'}
          </div>

          <h2 className={styles.title}>
            {achievedMastery ? 'Conceptual Breakthrough!' : 'Teaching Session Debrief'}
          </h2>

          <p className={styles.subtitle}>
            {debrief?.summary || (achievedMastery
              ? `Fantastic teaching! You guided Sue from confusing basketball tiredness to understanding virus transmission and incubation periods.`
              : `You completed the teaching session with ${participant?.studentName || 'Sue'}. Here is an assessment of your teaching moves:`)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Final Student State
            </div>
            <div className={styles.statBadgeWrapper}>
              <span className={`state-badge state-${currentState}`}>
                {currentState}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Dialogue Turns
            </div>
            <div className={styles.statValTurns}>
              {session.turnCount} turns
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              ⏱️ Total Duration
            </div>
            <div className={styles.statValDuration}>
              {formatDuration(session.startedAt, session.endedAt)}
            </div>
            {session.startedAt && session.endedAt && (
              <div className={styles.statTimeRange}>
                {formatMessageTime(session.startedAt)} – {formatMessageTime(session.endedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Teaching Strategy Breakdown */}
        <div className={styles.strategyCard}>
          <div className={styles.strategyHeader}>
            <span className={styles.strategyTitle}>
              Teaching Strategy Distribution
            </span>
            <span className={styles.strategySummaryText}>
              Probing: {probingPct}% · Discovery: {discoveryPct}% · Telling: {tellingPct}%
            </span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className={styles.stackedBar}>
            <div
              className={styles.barProbing}
              style={{ width: `${probingPct}%` }}
              title={`Probing: ${probingPct}%`}
            />
            <div
              className={styles.barDiscovery}
              style={{ width: `${discoveryPct}%` }}
              title={`Guided Discovery: ${discoveryPct}%`}
            />
            <div
              className={styles.barTelling}
              style={{ width: `${tellingPct}%` }}
              title={`Telling: ${tellingPct}%`}
            />
          </div>

          <div className={styles.legendRow}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotProbing} />
              Probing ({probingPct}%)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotDiscovery} />
              Guided Discovery ({discoveryPct}%)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotTelling} />
              Telling ({tellingPct}%)
            </span>
          </div>
        </div>

        {/* Breakthrough Moment Highlight */}
        {debrief?.breakthroughMoment && (
          <div className={styles.breakthroughCard}>
            <div className={styles.breakthroughTitle}>
              💡 Breakthrough Turning Point
            </div>
            <p className={styles.breakthroughBody}>
              {debrief.breakthroughMoment}
            </p>
          </div>
        )}

        {/* Strengths & Growth Opportunities */}
        <div className={styles.feedbackGrid}>
          {debrief?.strengths && debrief.strengths.length > 0 && (
            <div className={styles.strengthsCard}>
              <div className={styles.strengthsTitle}>
                ✅ Teaching Strengths
              </div>
              <ul className={styles.list}>
                {debrief.strengths.map((s, i) => (
                  <li key={i} className={styles.listItem}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {debrief?.growthOpportunities && debrief.growthOpportunities.length > 0 && (
            <div className={styles.growthCard}>
              <div className={styles.growthTitle}>
                🌱 Teaching Coaching Tips
              </div>
              <ul className={styles.list}>
                {debrief.growthOpportunities.map((g, i) => (
                  <li key={i} className={styles.listItem}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={`btn-secondary ${styles.actionBtnReview}`}
            onClick={onClose}
          >
            Review Conversation
          </button>
          <button
            type="button"
            className={`btn-primary ${styles.actionBtnRestart}`}
            onClick={onRestart}
          >
            Teach Another Session
          </button>
        </div>
      </div>
    </div>
  );
};
