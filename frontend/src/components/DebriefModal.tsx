import React from 'react';
import { SessionData, StudentState, DebriefData } from '../types';
import { formatDuration, formatMessageTime } from '../utils/formatters';

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
    <div
      id="debrief-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        id="debrief-modal-card"
        className="glass-panel animate-slide-up"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px 36px',
          background: 'var(--bg-secondary)',
          border: achievedMastery
            ? '2px solid rgba(16, 185, 129, 0.6)'
            : '1px solid var(--glass-border)',
          boxShadow: achievedMastery
            ? '0 0 50px rgba(16, 185, 129, 0.35)'
            : 'var(--glass-shadow)'
        }}
      >
        {/* Header Badge & Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
            {achievedMastery ? '🏆' : '📚'}
          </div>

          <h2 style={{ fontSize: '1.7rem', margin: '0 0 8px', fontWeight: 800 }}>
            {achievedMastery ? 'Conceptual Breakthrough!' : 'Teaching Session Debrief'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
            {debrief?.summary || (achievedMastery
              ? `Fantastic teaching! You guided Sue from confusing basketball tiredness to understanding virus transmission and incubation periods.`
              : `You completed the teaching session with ${participant?.studentName || 'Sue'}. Here is an assessment of your teaching moves:`)}
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Final Student State
            </div>
            <div style={{ marginTop: '6px' }}>
              <span className={`state-badge state-${currentState}`}>
                {currentState}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Dialogue Turns
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-cyan)' }}>
              {session.turnCount} turns
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              ⏱️ Total Duration
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-purple)' }}>
              {formatDuration(session.startedAt, session.endedAt)}
            </div>
            {session.startedAt && session.endedAt && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatMessageTime(session.startedAt)} – {formatMessageTime(session.endedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Teaching Strategy Breakdown */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            border: '1px solid var(--glass-border)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Teaching Strategy Distribution
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Probing: {probingPct}% · Discovery: {discoveryPct}% · Telling: {tellingPct}%
            </span>
          </div>

          {/* Stacked Percentage Bar */}
          <div
            style={{
              height: '14px',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.1)',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                width: `${probingPct}%`,
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                transition: 'width 600ms ease'
              }}
              title={`Probing: ${probingPct}%`}
            />
            <div
              style={{
                width: `${discoveryPct}%`,
                background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                transition: 'width 600ms ease'
              }}
              title={`Guided Discovery: ${discoveryPct}%`}
            />
            <div
              style={{
                width: `${tellingPct}%`,
                background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                transition: 'width 600ms ease'
              }}
              title={`Telling: ${tellingPct}%`}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
              Probing ({probingPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></span>
              Guided Discovery ({discoveryPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              Telling ({tellingPct}%)
            </span>
          </div>
        </div>

        {/* Breakthrough Moment Highlight */}
        {debrief?.breakthroughMoment && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
              💡 Breakthrough Turning Point
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {debrief.breakthroughMoment}
            </p>
          </div>
        )}

        {/* Strengths & Growth Opportunities */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {debrief?.strengths && debrief.strengths.length > 0 && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✅ Teaching Strengths
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {debrief.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {debrief?.growthOpportunities && debrief.growthOpportunities.length > 0 && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.08)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(234, 179, 8, 0.2)'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                🌱 Teaching Coaching Tips
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {debrief.growthOpportunities.map((g, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 20px' }}
          >
            Review Conversation
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onRestart}
            style={{ padding: '10px 24px' }}
          >
            Teach Another Session
          </button>
        </div>
      </div>
    </div>
  );
};
