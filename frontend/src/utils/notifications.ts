export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionHint?: string;
  timestamp: number;
  durationMs?: number;
}

type NotificationListener = (notifications: AppNotification[]) => void;

let activeNotifications: AppNotification[] = [];
const listeners: Set<NotificationListener> = new Set();

function emit() {
  const snapshot = [...activeNotifications];
  listeners.forEach((listener) => listener(snapshot));
}

export const notificationHub = {
  subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    listener([...activeNotifications]);
    return () => listeners.delete(listener);
  },

  dismiss(id: string) {
    activeNotifications = activeNotifications.filter((n) => n.id !== id);
    emit();
  },

  notify(
    type: NotificationType,
    title: string,
    message: string,
    options?: { actionHint?: string; durationMs?: number }
  ) {
    // Avoid duplicate notifications with same title and message
    const existing = activeNotifications.find(
      (n) => n.title === title && n.message === message
    );
    if (existing) return;

    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const durationMs = options?.durationMs ?? (type === 'error' ? 8000 : 5000);

    const item: AppNotification = {
      id,
      type,
      title,
      message,
      actionHint: options?.actionHint,
      timestamp: Date.now(),
      durationMs
    };

    activeNotifications = [item, ...activeNotifications.slice(0, 4)];
    emit();

    if (durationMs > 0) {
      setTimeout(() => {
        notificationHub.dismiss(id);
      }, durationMs);
    }
  },

  error(title: string, message: string, actionHint?: string) {
    this.notify('error', title, message, { actionHint, durationMs: 9000 });
  },

  warning(title: string, message: string, actionHint?: string) {
    this.notify('warning', title, message, { actionHint, durationMs: 7000 });
  },

  info(title: string, message: string) {
    this.notify('info', title, message);
  },

  success(title: string, message: string) {
    this.notify('success', title, message, { durationMs: 4000 });
  }
};
