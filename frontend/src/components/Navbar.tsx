import React from 'react';
import { TeacherBadge } from '../types';
import styles from './Navbar.module.css';

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
    <header id="main-navbar" className={styles.navbar}>
      <div className={`container-max ${styles.inner}`}>
        {/* Left: Brand & Classroom */}
        <div
          className={`${styles.brand} ${onGoHome ? styles.brandClickable : ''}`}
          onClick={onGoHome}
        >
          <div className={styles.brandLogo}>
            🔬
          </div>
          <div>
            <div className={styles.brandTitleRow}>
              <span className={styles.brandTitle}>
                Student AI
              </span>
            </div>
            {classroomName && (
              <div className={styles.classroomSub}>
                {classroomName}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Theme Toggle, Past Conversations & Teacher Controls */}
        <div className={styles.actions}>
          {onToggleTheme && (
            <button
              id="btn-toggle-theme"
              type="button"
              className={`btn-secondary ${styles.themeBtn}`}
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
          )}

          {onOpenPastConversations && (
            <button
              id="btn-view-past-conversations"
              type="button"
              className={`btn-secondary ${styles.pastConversationsBtn}`}
              onClick={onOpenPastConversations}
            >
              <span>📜</span>
              <span>View Past Conversations</span>
            </button>
          )}

          {teacherName && (
            <>
              {turnCount !== undefined && (
                <div
                  className={`${styles.turnBadge} ${turnCount === 0 ? styles.turnBadgeInitial : styles.turnBadgeActive}`}
                >
                  {turnCount === 0 ? '🟢 Ready to start' : `Turn #${turnCount}`}
                </div>
              )}

              <div className={styles.teacherPill}>
                <span className={styles.teacherEmoji}>
                  {teacherBadge ? BADGE_EMOJIS[teacherBadge] : '🧑‍🏫'}
                </span>
                <span className={styles.teacherName}>
                  {teacherName}
                </span>
              </div>

              {onEndSession && (
                <button
                  id="btn-end-session"
                  onClick={onEndSession}
                  className={`btn-secondary ${styles.endLessonBtn}`}
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
