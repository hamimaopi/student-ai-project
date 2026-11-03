/**
 * Date, time, and conversation duration formatters for Student AI.
 */

/**
 * Formats an ISO timestamp into a clean localized time string (e.g., "8:32 PM").
 */
export function formatMessageTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Formats an ISO timestamp into a full localized date and time string.
 */
export function formatFullDateTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

/**
 * Calculates human-readable elapsed duration between two ISO timestamps.
 * E.g., "4m 12s", "1h 15m 20s", or "45s".
 */
export function formatDuration(startIso?: string | null, endIso?: string | null): string {
  if (!startIso) return '0s';
  try {
    const start = new Date(startIso).getTime();
    if (isNaN(start)) return '0s';
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  } catch {
    return '0s';
  }
}

/**
 * Formats elapsed seconds into a stopwatch digital clock format (e.g., "03:45").
 */
export function formatStopwatch(secondsTotal: number): string {
  const mins = Math.floor(secondsTotal / 60);
  const secs = Math.floor(secondsTotal % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}
