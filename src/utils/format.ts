/**
 * Format video duration in seconds to human-readable string.
 * e.g., 35 -> "35s", 85 -> "1m 25s", 3600 -> "1h", 5400 -> "1h 30m"
 */
export function formatDuration(durationInSeconds: number): string {
  const val = Math.max(0, Math.round(durationInSeconds || 0));
  if (val === 0) return '0s';

  const hours = Math.floor(val / 3600);
  const mins = Math.floor((val % 3600) / 60);
  const secs = val % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

/**
 * Format seconds to mm:ss or hh:mm:ss for video player.
 * e.g., 3661 -> "1:01:01"
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Format year from date string.
 */
export function formatYear(dateString: string): number {
  return new Date(dateString).getFullYear();
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
