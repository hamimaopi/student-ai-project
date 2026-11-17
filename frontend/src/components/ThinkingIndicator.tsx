import React from 'react';
import styles from './ThinkingIndicator.module.css';

interface Props {
  studentName?: string;
  avatarUrl?: string;
}

export const ThinkingIndicator: React.FC<Props> = ({
  studentName = 'The class',
  avatarUrl
}) => {
  return (
    <div id="thinking-indicator" className={`animate-slide-up ${styles.container}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={studentName}
          className={styles.avatar}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/avatar_sue.png';
          }}
        />
      ) : (
        <div className={styles.avatarPlaceholder} title="Classroom reflection">
          👥
        </div>
      )}
      <div className={styles.bubble}>
        <span className={styles.text}>
          {studentName} is thinking
        </span>
        <div className={styles.dotsRow}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
};
