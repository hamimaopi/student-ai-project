import React, { useEffect, useRef } from 'react';
import { ChatMessage, TeacherBadge } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';
import { formatMessageTime, formatDuration } from '../utils/formatters';
import styles from './ChatMessages.module.css';

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
  studentName?: string;
  studentAvatarUrl?: string;
  thinkingStudentName?: string;
  thinkingAvatarUrl?: string;
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

const STATE_BADGE_SHORT: Record<string, { label: string; icon: string }> = {
  CONFIDENTLY_WRONG: { label: 'Confidently Wrong', icon: '🔴' },
  DEFENSIVE: { label: 'Defensive', icon: '🟠' },
  CONFUSED: { label: 'Confused', icon: '🟡' },
  TENTATIVELY_CORRECT: { label: 'Tentatively Correct', icon: '🔵' },
  UNDERSTANDING: { label: 'Understanding', icon: '🟢' }
};

const ROUTING_LABELS: Record<string, string> = {
  MANUAL_TEACHER_SELECTION: '🎯 Called On',
  DIRECT_INVITATION_REFERENCING_PEER: '💬 Discussing Peer',
  PEER_EXCLUSION_QUERY: '🔄 Peer Inquiry',
  DIRECT_VOCATIVE_ADDRESS_START: '🙋 Addressed',
  DIRECT_VOCATIVE_ADDRESS_END: '🙋 Addressed',
  OPEN_CLASS_WEIGHTED_SELECTION: '✋ Volunteered'
};

export const ChatMessages: React.FC<Props> = ({
  messages,
  isThinking,
  studentName,
  studentAvatarUrl,
  thinkingStudentName,
  thinkingAvatarUrl,
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
    <div id="chat-messages-container" className={styles.container}>
      {messages.length === 0 && !isThinking && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h4 className={styles.emptyTitle}>
            Science Classroom Ready
          </h4>
          <p className={styles.emptyText}>
            Marcus, Lena, and Sue are sitting at their desks ready for science class! Ask them what caused Anthony's cold to start the discussion, or call on a specific student.
          </p>
        </div>
      )}

      {messages.map((msg) => {
        const isTeacher = msg.senderType === 'TEACHER';

        return (
          <div
            key={msg.id}
            id={`message-turn-${msg.turnNumber}`}
            className={`animate-slide-up ${styles.messageRow} ${isTeacher ? styles.messageRowTeacher : styles.messageRowStudent}`}
          >
            {/* Avatar */}
            {isTeacher ? (
              <div className={styles.teacherAvatar}>
                {BADGE_EMOJIS[teacherBadge] || '🧑‍🏫'}
              </div>
            ) : (
              <img
                src={msg.avatarUrl || studentAvatarUrl}
                alt={msg.senderName}
                className={styles.studentAvatar}
              />
            )}

            {/* Bubble */}
            <div className={styles.messageContentCol}>
              <div className={`${styles.messageHeader} ${isTeacher ? styles.headerTeacher : styles.headerStudent}`}>
                <span className={styles.senderName}>
                  {isTeacher ? teacherName : msg.senderName}
                </span>

                {!isTeacher && msg.studentStateSnapshot && STATE_BADGE_SHORT[msg.studentStateSnapshot] && (
                  <span className={`state-badge state-${msg.studentStateSnapshot} ${styles.msgStatePill}`}>
                    <span>{STATE_BADGE_SHORT[msg.studentStateSnapshot].icon}</span>
                    <span>{STATE_BADGE_SHORT[msg.studentStateSnapshot].label}</span>
                  </span>
                )}

                {msg.routingReason && ROUTING_LABELS[msg.routingReason] && (
                  <span className={styles.routingBadge}>
                    {ROUTING_LABELS[msg.routingReason]}
                  </span>
                )}

                <span className={styles.turnBadge}>
                  Turn #{msg.turnNumber}
                </span>

                <span
                  title={new Date(msg.createdAt || Date.now()).toLocaleString()}
                  className={styles.timeBadge}
                >
                  <span className={styles.timeIcon}>🕒</span>
                  <span>{formatMessageTime(msg.createdAt || new Date().toISOString())}</span>
                </span>
              </div>

              <div className={`${styles.bubble} ${isTeacher ? styles.bubbleTeacher : styles.bubbleStudent}`}>
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}

      {isThinking && (
        <ThinkingIndicator
          studentName={thinkingStudentName || studentName}
          avatarUrl={thinkingAvatarUrl || studentAvatarUrl}
        />
      )}

      {/* Conversation Concluded Summary Card */}
      {endedAt && messages.length > 0 && (
        <div id="conversation-concluded-card" className={`animate-slide-up ${styles.concludedCard}`}>
          <div className={styles.concludedHeader}>
            <span className={styles.concludedIcon}>🏁</span>
            <span className={styles.concludedTitle}>
              Conversation Concluded
            </span>
          </div>

          <p className={styles.concludedSubtext}>
            Teaching dialogue with {studentName} has finished. Here is how long the conversation took:
          </p>

          <div className={`${styles.statsGrid} ${onOpenDebrief ? styles.statsGridWithDebrief : ''}`}>
            <div>
              <div className={styles.statLabel}>
                Total Duration
              </div>
              <div className={styles.statValDuration}>
                {conversationDuration}
              </div>
            </div>
            <div>
              <div className={styles.statLabel}>
                Total Messages
              </div>
              <div className={styles.statValMessages}>
                {messages.length} msgs
              </div>
            </div>
            <div>
              <div className={styles.statLabel}>
                Dialogue Turns
              </div>
              <div className={styles.statValTurns}>
                {messages[messages.length - 1]?.turnNumber || Math.ceil(messages.length / 2)}
              </div>
            </div>
          </div>

          {onOpenDebrief && (
            <button
              type="button"
              className={`btn-primary ${styles.debriefBtn}`}
              onClick={onOpenDebrief}
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
