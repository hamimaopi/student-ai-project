import React from 'react';
import { TeacherBadge } from '../types';
import styles from './TeacherBadgeSelector.module.css';

interface TeacherBadgeOption {
  id: TeacherBadge;
  name: string;
  emoji: string;
  description: string;
}

const BADGES: TeacherBadgeOption[] = [
  { id: 'fox', name: 'Curious Fox', emoji: '🦊', description: 'Clever & inquisitive' },
  { id: 'owl', name: 'Wise Owl', emoji: '🦉', description: 'Patient & insightful' },
  { id: 'otter', name: 'Playful Otter', emoji: '🦦', description: 'Encouraging & friendly' },
  { id: 'panda', name: 'Gentle Panda', emoji: '🐼', description: 'Calm & supportive' }
];

interface Props {
  selectedBadge: TeacherBadge;
  onSelect: (badge: TeacherBadge) => void;
}

export const TeacherBadgeSelector: React.FC<Props> = ({ selectedBadge, onSelect }) => {
  return (
    <div className={styles.container}>
      {BADGES.map((b) => {
        const isSelected = selectedBadge === b.id;
        return (
          <button
            key={b.id}
            id={`badge-select-${b.id}`}
            type="button"
            onClick={() => onSelect(b.id)}
            className={`${styles.badgeButton} ${isSelected ? styles.badgeButtonSelected : ''}`}
          >
            <span className={styles.badgeEmoji}>{b.emoji}</span>
            <div>
              <div className={`${styles.badgeName} ${isSelected ? styles.badgeNameSelected : ''}`}>
                {b.name}
              </div>
              <div className={styles.badgeDesc}>
                {b.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
