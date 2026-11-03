import React from 'react';
import { TeacherBadge } from '../types';

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
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {BADGES.map((b) => {
        const isSelected = selectedBadge === b.id;
        return (
          <button
            key={b.id}
            id={`badge-select-${b.id}`}
            type="button"
            onClick={() => onSelect(b.id)}
            style={{
              flex: '1 1 calc(50% - 6px)',
              minWidth: '130px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              background: isSelected
                ? 'var(--gradient-brand-subtle)'
                : 'var(--bg-surface)',
              border: isSelected
                ? '1.5px solid var(--accent-cyan)'
                : '1px solid var(--glass-border)',
              boxShadow: isSelected
                ? '0 0 16px rgba(56, 189, 248, 0.25)'
                : 'none',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all var(--transition-fast)',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{b.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                {b.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {b.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
