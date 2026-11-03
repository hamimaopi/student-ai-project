import React from 'react';
import { TeacherBadge } from '../types';

interface Props {
  classroomName?: string;
  teacherName?: string;
  teacherBadge?: TeacherBadge;
  turnCount?: number;
  onEndSession?: () => void;
  onOpenPastConversations?: () => void;
  onGoHome?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const BADGE_EMOJIS: Record<TeacherBadge, string> = {
  fox: '🦊',
  owl: '🦉',
  otter: '🦦',
  panda: '🐼'
};

export const Navbar: React.FC<Props> = ({
  classroomName,
  teacherName,
  teacherBadge,
  turnCount,
  onEndSession,
  onOpenPastConversations,
  onGoHome,
  theme = 'dark',
  onToggleTheme
}) => {
  return (
    <header
      id="main-navbar"
      style={{
        height: '68px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}
    >
      <div
        className="container-max"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left: Brand & Classroom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: onGoHome ? 'pointer' : 'default'
          }}
          onClick={onGoHome}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.45)',
              fontSize: '1.2rem'
            }}
          >
            🔬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                Student AI
              </span>
            </div>
            {classroomName && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {classroomName}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Theme Toggle, Past Conversations & Teacher Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleTheme && (
            <button
              id="btn-toggle-theme"
              type="button"
              className="btn-secondary"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              style={{
                fontSize: '1rem',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
          )}

          {onOpenPastConversations && (
            <button
              id="btn-view-past-conversations"
              type="button"
              className="btn-secondary"
              onClick={onOpenPastConversations}
              style={{
                fontSize: '0.82rem',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📜</span>
              <span>View Past Conversations</span>
            </button>
          )}

          {teacherName && (
            <>
              {turnCount !== undefined && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: turnCount === 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    background: turnCount === 0 ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid ' + (turnCount === 0 ? 'rgba(56, 189, 248, 0.3)' : 'var(--glass-border)')
                  }}
                >
                  {turnCount === 0 ? '🟢 Ready to start' : `Turn #${turnCount}`}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-surface)',
                  padding: '4px 12px 4px 6px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {teacherBadge ? BADGE_EMOJIS[teacherBadge] : '🧑‍🏫'}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {teacherName}
                </span>
              </div>

              {onEndSession && (
                <button
                  id="btn-end-session"
                  onClick={onEndSession}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  End Lesson
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
