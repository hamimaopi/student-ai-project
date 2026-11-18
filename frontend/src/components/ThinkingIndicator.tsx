import React from 'react';
import { getStudentAvatarUrl } from '../utils/avatarUtils';
import styles from './ThinkingIndicator.module.css';

interface Props {
  studentName?: string;
  avatarUrl?: string;
}

export const ThinkingIndicator: React.FC<Props> = ({
  studentName = 'The class',
  avatarUrl
}) => {
  const isWholeClass =
    !studentName ||
    studentName.trim().toLowerCase() === 'the class' ||
    studentName.trim().toLowerCase() === 'class';

  const resolvedAvatar = isWholeClass
    ? undefined
    : (avatarUrl ? getStudentAvatarUrl(studentName, avatarUrl) : (studentName ? getStudentAvatarUrl(studentName) : undefined));

  return (
    <div id="thinking-indicator" className={`animate-slide-up ${styles.container}`}>
      {resolvedAvatar ? (
        <img
          src={resolvedAvatar}
          alt={studentName}
          className={styles.avatar}
          onError={(e) => {
            const fallback = getStudentAvatarUrl(studentName);
            if (fallback) {
              (e.target as HTMLImageElement).src = fallback;
            }
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
