import React, { useState, useEffect } from 'react';
import { notificationHub, AppNotification } from '../utils/notifications';
import styles from './ToastContainer.module.css';

const TYPE_CONFIG = {
  error: {
    icon: '❌',
    border: 'rgba(244, 63, 94, 0.45)',
    bg: 'rgba(30, 15, 20, 0.92)',
    titleColor: '#f43f5e',
    glow: '0 8px 32px rgba(244, 63, 94, 0.25)'
  },
  warning: {
    icon: '⚠️',
    border: 'rgba(245, 158, 11, 0.45)',
    bg: 'rgba(35, 25, 12, 0.92)',
    titleColor: '#f59e0b',
    glow: '0 8px 32px rgba(245, 158, 11, 0.25)'
  },
  info: {
    icon: 'ℹ️',
    border: 'rgba(56, 189, 248, 0.45)',
    bg: 'rgba(12, 25, 38, 0.92)',
    titleColor: '#38bdf8',
    glow: '0 8px 32px rgba(56, 189, 248, 0.25)'
  },
  success: {
    icon: '✅',
    border: 'rgba(16, 185, 129, 0.45)',
    bg: 'rgba(12, 30, 22, 0.92)',
    titleColor: '#10b981',
    glow: '0 8px 32px rgba(16, 185, 129, 0.25)'
  }
};

export const ToastContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    return notificationHub.subscribe((items) => {
      setNotifications(items);
    });
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div id="toast-notification-container" className={styles.container}>
      {notifications.map((n) => {
        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;

        return (
          <div
            key={n.id}
            id={`toast-${n.id}`}
            className={`animate-slide-up ${styles.toastCard}`}
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              boxShadow: `${config.glow}, 0 10px 24px rgba(0, 0, 0, 0.5)`
            }}
          >
            <span className={styles.toastIcon}>{config.icon}</span>

            <div className={styles.toastBody}>
              <div className={styles.toastHeader}>
                <h5
                  className={styles.toastTitle}
                  style={{ color: config.titleColor }}
                >
                  {n.title}
                </h5>

                <button
                  type="button"
                  onClick={() => notificationHub.dismiss(n.id)}
                  className={styles.dismissBtn}
                  title="Dismiss notification"
                >
                  ×
                </button>
              </div>

              <p className={styles.toastMessage}>
                {n.message}
              </p>

              {n.actionHint && (
                <div className={styles.actionHintBox}>
                  <strong>💡 Next step:</strong> {n.actionHint}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
