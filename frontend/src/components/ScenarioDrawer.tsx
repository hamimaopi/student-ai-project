import React, { useState } from 'react';
import styles from './ScenarioDrawer.module.css';

interface Props {
  title: string;
  description: string;
}

export const ScenarioDrawer: React.FC<Props> = ({ title, description }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div id="scenario-drawer" className={`glass-panel ${styles.drawer}`}>
      <div
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerLeft}>
          <span className={styles.scenarioIcon}>📋</span>
          <div>
            <div className={styles.badge}>
              Classroom Scenario
            </div>
            <h3 className={styles.title}>
              {title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          className={styles.toggleBtn}
        >
          {isExpanded ? 'Hide Story ▲' : 'Read Story ▼'}
        </button>
      </div>

      {isExpanded && (
        <div className={`animate-fade-in ${styles.body}`}>
          <p className={styles.description}>
            {description}
          </p>
        </div>
      )}
    </div>
  );
};
