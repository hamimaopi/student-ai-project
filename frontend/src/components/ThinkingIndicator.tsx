import React from 'react';
import styles from './ThinkingIndicator.module.css';

interface Props {
  studentName?: string;
  avatarUrl?: string;
}

export const ThinkingIndicator: React.FC<Props> = ({
  studentName = 'Sue',
  avatarUrl = '/images/avatar_sue.jpg'
}) => {
  return (
    <div id="thinking-indicator" className={`animate-slide-up ${styles.container}`}>
      <img
        src={avatarUrl}
        alt={studentName}
        className={styles.avatar}
      />
      <div className={styles.bubble}>
        <span className={styles.text}>
          {studentName} is thinking
        </span>
        <div className={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={styles.dot}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
