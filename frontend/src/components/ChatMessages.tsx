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
    <div id="chat-messages-container" className={styles.container}>
      {messages.length === 0 && !isThinking && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h4 className={styles.emptyTitle}>
            Classroom Discussion Ready
          </h4>
          <p className={styles.emptyText}>
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
        <ThinkingIndicator studentName={studentName} avatarUrl={studentAvatarUrl} />
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
