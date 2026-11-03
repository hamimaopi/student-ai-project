import React, { useState } from 'react';

interface Props {
  title: string;
  description: string;
}

export const ScenarioDrawer: React.FC<Props> = ({ title, description }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div
      id="scenario-drawer"
      className="glass-panel"
      style={{
        padding: '16px 20px',
        marginBottom: '16px',
        borderLeft: '4px solid var(--accent-cyan)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>📋</span>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classroom Scenario
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>
              {title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {isExpanded ? 'Hide Story ▲' : 'Read Story ▼'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} className="animate-fade-in">
          <p
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.65,
              color: 'var(--text-main)',
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              marginBottom: '12px'
            }}
          >
            {description}
          </p>

          {/* Teaching Clues & Distractor Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-cyan)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              🔍 Clue: Sam & Anthony worked closely
            </span>
            <span
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                color: 'var(--accent-purple)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(168, 85, 247, 0.25)'
              }}
            >
              ⏳ Mechanism: Incubation period takes days
            </span>
            <span
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--state-confidently-wrong)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(244, 63, 94, 0.25)'
              }}
            >
              ⚠️ Distractor: Basketball tiredness is a symptom, not the cause
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
