import { api } from './api';
import { env } from '@/config/env';
import { API_ENDPOINTS } from '@/constants/api';
import type { Movie } from '@/types/movie';
import { movieStore } from './movieStore.service';

const STORAGE_KEY = 'sekolah_nakal_user_watchlist';

function getStoredWatchlist(): Movie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveWatchlist(list: Movie[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export const watchlistService = {
  async getWatchlist(): Promise<Movie[]> {
    if (env.USE_MOCK) {
      return getStoredWatchlist();
    }
    return api.get(API_ENDPOINTS.USER.WATCHLIST);
  },

  async toggleWatchlist(movieId: string): Promise<{ added: boolean }> {
    if (env.USE_MOCK) {
      const current = getStoredWatchlist();
      const index = current.findIndex((m) => m.id === movieId);
      if (index >= 0) {
        current.splice(index, 1);
        saveWatchlist(current);
        return { added: false };
      }
      const movie = movieStore.getAll().find((m) => m.id === movieId);
      if (movie) {
        current.push(movie);
        saveWatchlist(current);
        return { added: true };
      }
      return { added: false };
    }
    return api.post(API_ENDPOINTS.USER.WATCHLIST_TOGGLE(movieId));
  },

  async isInWatchlist(movieId: string): Promise<boolean> {
    if (env.USE_MOCK) {
      return getStoredWatchlist().some((m) => m.id === movieId);
    }
    const list = await this.getWatchlist();
    return list.some((m) => m.id === movieId);
  },
};
