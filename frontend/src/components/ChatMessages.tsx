import React, { useEffect, useRef } from 'react';
import { ChatMessage, TeacherBadge } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';
import { formatMessageTime, formatDuration } from '../utils/formatters';

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
  studentName?: string;
  studentAvatarUrl?: string;
  teacherName?: string;
  teacherBadge?: TeacherBadge;
  startedAt?: string;
  endedAt?: string | null;
  onOpenDebrief?: () => void;
}

const BADGE_EMOJIS: Record<TeacherBadge, string> = {
  fox: '🦊',
  owl: '🦉',
  otter: '🦦',
  panda: '🐼'
};

export const ChatMessages: React.FC<Props> = ({
  messages,
  isThinking,
  studentName = 'Sue',
  studentAvatarUrl = '/images/avatar_sue.jpg',
  teacherName = 'Teacher',
  teacherBadge = 'fox',
  startedAt,
  endedAt,
  onOpenDebrief
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, endedAt]);

  const conversationDuration = formatDuration(
    startedAt || (messages.length > 0 ? messages[0].createdAt : null),
    endedAt || (messages.length > 1 ? messages[messages.length - 1].createdAt : null)
  );

  return (
    <div
      id="chat-messages-container"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {messages.length === 0 && !isThinking && (
        <div
          style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: '420px',
            padding: '32px 20px',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
          <h4 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            Classroom Discussion Ready
          </h4>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            Sue is sitting at her desk thinking about what happened to Anthony. Ask her what she thinks caused his cold to begin the conversation!
          </p>
        </div>
      )}

      {messages.map((msg) => {
        const isTeacher = msg.senderType === 'TEACHER';

        return (
          <div
            key={msg.id}
            id={`message-turn-${msg.turnNumber}`}
            className="animate-slide-up"
            style={{
              display: 'flex',
              flexDirection: isTeacher ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: '12px',
              maxWidth: '82%',
              alignSelf: isTeacher ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Avatar */}
            {isTeacher ? (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  flexShrink: 0
                }}
              >
                {BADGE_EMOJIS[teacherBadge] || '🧑‍🏫'}
              </div>
            ) : (
              <img
                src={msg.avatarUrl || studentAvatarUrl}
                alt={msg.senderName}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0
                }}
              />
            )}

            {/* Bubble */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  justifyContent: isTeacher ? 'flex-end' : 'flex-start'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {isTeacher ? teacherName : msg.senderName}
                </span>

                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-dim)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    padding: '1px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  Turn #{msg.turnNumber}
                </span>

                <span
                  title={new Date(msg.createdAt || Date.now()).toLocaleString()}
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-dim)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <span style={{ opacity: 0.65, fontSize: '0.65rem' }}>🕒</span>
                  <span>{formatMessageTime(msg.createdAt || new Date().toISOString())}</span>
                </span>
              </div>

              <div
                style={{
                  background: isTeacher
                    ? 'var(--gradient-brand-subtle)'
                    : 'var(--bg-surface)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: isTeacher
                    ? '1px solid var(--accent-indigo)'
                    : '1px solid var(--glass-border)',
                  borderRadius: isTeacher
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  padding: '14px 18px',
                  color: 'var(--text-main)',
                  fontSize: '0.94rem',
                  lineHeight: 1.6,
                  boxShadow: isTeacher
                    ? '0 6px 20px rgba(99, 102, 241, 0.2)'
                    : 'var(--glass-shadow)'
                }}
              >
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}

      {isThinking && (
        <ThinkingIndicator studentName={studentName} avatarUrl={studentAvatarUrl} />
      )}

      {/* Conversation Concluded Summary Card */}
      {endedAt && messages.length > 0 && (
        <div
          id="conversation-concluded-card"
          className="animate-slide-up"
          style={{
            margin: '18px auto 8px',
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--accent-indigo)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.3rem' }}>🏁</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Conversation Concluded
            </span>
          </div>

          <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Teaching dialogue with {studentName} has finished. Here is how long the conversation took:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              background: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              marginBottom: onOpenDebrief ? '16px' : '0'
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Total Duration
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {conversationDuration}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Total Messages
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {messages.length} msgs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Dialogue Turns
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '2px' }}>
                {messages[messages.length - 1]?.turnNumber || Math.ceil(messages.length / 2)}
              </div>
            </div>
          </div>

          {onOpenDebrief && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenDebrief}
              style={{
                fontSize: '0.82rem',
                padding: '7px 20px',
                margin: '0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>View Pedagogical Debrief</span>
              <span>📊</span>
            </button>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
