import React from 'react';
import { SessionData, StudentState, DebriefData, SessionParticipant } from '../types';
import { formatDuration, formatMessageTime } from '../utils/formatters';
import styles from './DebriefModal.module.css';

interface Props {
  session: SessionData;
  onClose: () => void;
  onRestart: () => void;
}

export const DebriefModal: React.FC<Props> = ({ session, onClose, onRestart }) => {
  const participants: SessionParticipant[] = session.participants || [];
  const debrief: DebriefData | undefined | null = session.debrief;

  const anyUnderstood = participants.some((p) => p.currentState === 'UNDERSTANDING');
  const achievedMastery = debrief ? debrief.masteryAchieved : anyUnderstood;

  // Teaching Strategy Breakdown
  const strategyBreakdown = debrief?.strategyBreakdown || {
    PROBING: 45,
    GUIDED_DISCOVERY: 40,
    TELLING: 15
  };
  const probingPct = strategyBreakdown['PROBING'] || 0;
  const discoveryPct = strategyBreakdown['GUIDED_DISCOVERY'] || 0;
  const tellingPct = strategyBreakdown['TELLING'] || 0;

  // Attention Equity Breakdown
  const equityBreakdown = debrief?.equityBreakdown || {};
  const marcusPct = equityBreakdown['Marcus'] ?? 40;
  const lenaPct = equityBreakdown['Lena'] ?? 20;
  const suePct = equityBreakdown['Sue'] ?? 40;

  // Student Outcomes
  const outcomes = debrief?.studentOutcomes || {};

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

          <h2 id="debrief-title" className={styles.title}>
            {achievedMastery ? 'Conceptual Breakthrough!' : 'Classroom Debrief & Equity Analytics'}
          </h2>

          <p id="debrief-summary" className={styles.subtitle}>
            {debrief?.summary || (achievedMastery
              ? 'Outstanding whole-class orchestration! You guided the students through scientific reasoning to overcome misconceptions about disease transmission.'
              : 'You completed the teaching session with the science classroom. Here is an assessment of student trajectories and your facilitation moves:')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Classroom Mastery
            </div>
            <div className={styles.statBadgeWrapper}>
              <span className={`state-badge ${achievedMastery ? 'state-UNDERSTANDING' : 'state-CONFUSED'}`}>
                {achievedMastery ? 'Mastery Achieved' : 'In Progress'}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Total Dialogue Turns
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

        {/* Individual Student Trajectory Cards */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            🎓 Student Cognitive Trajectories
          </h3>
          <span className={styles.sectionSubtitle}>
            Starting State → Ending State
          </span>
        </div>

        <div id="student-trajectories-grid" className={styles.trajectoriesGrid}>
          {participants.map((p) => {
            const outcome = outcomes[p.studentName];
            const initState: StudentState = outcome?.initialState || p.initialState || 'CONFIDENTLY_WRONG';
            const finState: StudentState = outcome?.finalState || p.currentState;
            const turnsSpoken = outcome?.turnsSpoken ?? p.turnsSpoken ?? 0;
            const studentMastery = outcome ? outcome.masteryAchieved : finState === 'UNDERSTANDING';
            const breakthrough = outcome?.breakthroughMoment || (studentMastery
              ? 'Realized viral pathogens and incubation periods caused the cold.'
              : 'Actively questioned initial assumptions in dialogue with peers.');

            return (
              <div
                key={p.id}
                id={`trajectory-card-${p.studentName.toLowerCase()}`}
                className={`${styles.trajectoryCard} ${studentMastery ? styles.trajectoryCardMastery : ''}`}
              >
                <div className={styles.studentHeader}>
                  <img
                    src={p.avatarUrl}
                    alt={p.studentName}
                    className={styles.studentAvatar}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatar_sue.png';
                    }}
                  />
                  <div className={styles.studentMeta}>
                    <div className={styles.studentName}>
                      {p.studentName}
                    </div>
                    <div className={styles.studentPersonality}>
                      {p.personality}
                    </div>
                  </div>
                </div>

                <div className={styles.journeyRow}>
                  <span className={`state-badge state-${initState}`}>
                    {initState}
                  </span>
                  <span className={styles.journeyArrow}>→</span>
                  <span className={`state-badge state-${finState}`}>
                    {finState}
                  </span>
                </div>

                <div className={styles.trajectoryMetrics}>
                  <span className={styles.turnsTag}>
                    🗣️ {turnsSpoken} {turnsSpoken === 1 ? 'turn' : 'turns'}
                  </span>
                  <span className={`${styles.masteryTag} ${studentMastery ? styles.masteryTagAchieved : styles.masteryTagProgress}`}>
                    {studentMastery ? 'Mastery' : 'Progress'}
                  </span>
                </div>

                <div className={styles.studentBreakthrough}>
                  "{breakthrough}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Attention Equity Analytics Card */}
        <div id="attention-equity-card" className={styles.equityCard}>
          <div className={styles.equityHeader}>
            <span className={styles.equityTitle}>
              ⚖️ Facilitation Attention Equity
            </span>
            <span className={styles.equitySubtitle}>
              Actual Student Turns vs Target Weight (Marcus: 40% · Lena: 20% · Sue: 40%)
            </span>
          </div>

          {/* Stacked Percentage Bar for Students */}
          <div
            className={styles.stackedBarEquity}
            style={{
              '--marcus-pct': `${marcusPct}%`,
              '--lena-pct': `${lenaPct}%`,
              '--sue-pct': `${suePct}%`
            } as React.CSSProperties}
          >
            <div
              className={styles.barMarcus}
              title={`Marcus: ${marcusPct}% (Target: 40%)`}
            />
            <div
              className={styles.barLena}
              title={`Lena: ${lenaPct}% (Target: 20%)`}
            />
            <div
              className={styles.barSue}
              title={`Sue: ${suePct}% (Target: 40%)`}
            />
          </div>

          <div className={styles.legendRow}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotMarcus} />
              👦 Marcus: {marcusPct}% (Target: 40%)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotLena} />
              👧 Lena: {lenaPct}% (Target: 20%)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotSue} />
              👩 Sue: {suePct}% (Target: 40%)
            </span>
          </div>

          {/* Classroom Facilitator Coaching Advice */}
          {(debrief?.classroomManagementAdvice || debrief?.summary) && (
            <div className={styles.equityAdviceBox}>
              <span className={styles.equityAdviceIcon}>💡</span>
              <p className={styles.equityAdviceText}>
                {debrief.classroomManagementAdvice || 'Great job managing whole-class discourse. Continue balancing calls between eager and observant students.'}
              </p>
            </div>
          )}
        </div>

        {/* Teaching Strategy Distribution */}
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
          <div
            className={styles.stackedBar}
            style={{
              '--probing-width': `${probingPct}%`,
              '--discovery-width': `${discoveryPct}%`,
              '--telling-width': `${tellingPct}%`
            } as React.CSSProperties}
          >
            <div
              className={styles.barProbing}
              title={`Probing: ${probingPct}%`}
            />
            <div
              className={styles.barDiscovery}
              title={`Guided Discovery: ${discoveryPct}%`}
            />
            <div
              className={styles.barTelling}
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

        {/* Class Breakthrough Moment Highlight */}
        {debrief?.breakthroughMoment && (
          <div className={styles.breakthroughCard}>
            <div className={styles.breakthroughTitle}>
              🌟 Class Turning Point
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
                ✅ Orchestration Strengths
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
                🌱 Facilitation Coaching Tips
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
            id="btn-review-conversation"
            type="button"
            className={`btn-secondary ${styles.actionBtnReview}`}
            onClick={onClose}
          >
            Review Conversation
          </button>
          <button
            id="btn-teach-another-session"
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
