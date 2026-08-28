import type { WatchProgress } from '@/types/movie';

const STORAGE_KEY = 'sekolah-nakal-watch-progress';
const PROGRESS_EVENT = 'sekolah_nakal_watch_progress_updated';

/**
 * Watch progress and history service.
 * Persists watch progress reliably in localStorage with instant cross-component sync.
 */
export const streamingService = {
  async saveProgress(progress: WatchProgress): Promise<void> {
    try {
      const stored = this.getStoredProgress();
      stored[progress.movieId] = {
        ...progress,
        updatedAt: progress.updatedAt || new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: progress }));
      }
    } catch {
      // ignore storage errors
    }
  },

  async getProgress(movieId: string): Promise<WatchProgress | null> {
    const stored = this.getStoredProgress();
    return stored[movieId] ?? null;
  },

  async getContinueWatching(): Promise<WatchProgress[]> {
    const stored = this.getStoredProgress();
    return Object.values(stored)
      .filter((p) => p.currentTime > 5 && (p.duration <= 0 || p.currentTime < p.duration * 0.95))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getAllHistory(): Promise<WatchProgress[]> {
    const stored = this.getStoredProgress();
    return Object.values(stored).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
      }
    } catch {
      // ignore
    }
  },

  /** Internal: get all stored progress from localStorage */
  getStoredProgress(): Record<string, WatchProgress> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
};
