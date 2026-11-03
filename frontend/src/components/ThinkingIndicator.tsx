import React from 'react';

interface Props {
  studentName?: string;
  avatarUrl?: string;
}

export const ThinkingIndicator: React.FC<Props> = ({
  studentName = 'Sue',
  avatarUrl = '/images/avatar_sue.jpg'
}) => {
  return (
    <div
      id="thinking-indicator"
      className="animate-slide-up"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        margin: '12px 0'
      }}
    >
      <img
        src={avatarUrl}
        alt={studentName}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-full)',
          objectFit: 'cover',
          border: '1.5px solid #fbbf24',
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)'
        }}
      />
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '16px 16px 16px 4px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {studentName} is thinking
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#fbbf24',
                animation: 'dotPulse 1.2s infinite ease-in-out',
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
