/**
 * Service Konten Film Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Terhubung langsung ke store katalog (tambah/edit/hapus langsung sinkron).
 */

import { api } from './api';
import { env } from '@/config/env';
import { API_ENDPOINTS } from '@/constants/api';
import type { Movie, MovieDetail, StreamingData } from '@/types/movie';
import { movieStore } from './movieStore.service';
import { categoryStore } from './categoryStore.service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const movieService = {
  // Ambil film trending (diurutkan berdasarkan traffic / views terbanyak ke paling sedikit)
  async getTrending(): Promise<Movie[]> {
    if (env.USE_MOCK) {
      await delay(100);
      const all = movieStore.getAll();
      return [...all].sort((a, b) => {
        const viewsA = (parseInt(localStorage.getItem(`sn_views_${a.id}`) || '0', 10) || (a.views || 0));
        const viewsB = (parseInt(localStorage.getItem(`sn_views_${b.id}`) || '0', 10) || (b.views || 0));
        if (viewsB !== viewsA) return viewsB - viewsA;
        return (b.rating || 0) - (a.rating || 0);
      });
    }
    return api.get(API_ENDPOINTS.MOVIES.TRENDING);
  },

  // Ambil film terpopuler
  async getPopular(): Promise<Movie[]> {
    if (env.USE_MOCK) {
      await delay(100);
      const all = movieStore.getAll();
      return [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return api.get(API_ENDPOINTS.MOVIES.POPULAR);
  },

  // Ambil rilis terbaru (diurutkan berdasarkan tahun/terbaru)
  async getNewReleases(): Promise<Movie[]> {
    if (env.USE_MOCK) {
      await delay(100);
      const all = movieStore.getAll();
      return [...all].sort((a, b) => b.year - a.year).slice(0, 10);
    }
    return api.get(API_ENDPOINTS.MOVIES.NEW_RELEASES);
  },

  // Ambil detail film by ID
  async getById(id: string): Promise<MovieDetail> {
    if (env.USE_MOCK) {
      await delay(80);
      return movieStore.getById(id);
    }
    return api.get(API_ENDPOINTS.MOVIES.DETAIL(id));
  },

  // Pencarian film (judul, genre, overview)
  async search(query: string): Promise<Movie[]> {
    if (env.USE_MOCK) {
      await delay(80);
      const q = query.toLowerCase().trim();
      if (!q) return [];
      return movieStore.getAll().filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          (m.overview && m.overview.toLowerCase().includes(q))
      );
    }
    return api.get(`${API_ENDPOINTS.MOVIES.SEARCH}?q=${encodeURIComponent(query)}`);
  },

  // Ambil berdasarkan kategori genre / slug
  async getByGenre(genreOrSlug: string): Promise<Movie[]> {
    if (env.USE_MOCK) {
      await delay(80);
      const cat = categoryStore.getBySlug(genreOrSlug);
      const targetName = cat ? cat.name.toLowerCase() : genreOrSlug.toLowerCase().trim();
      const targetSlug = cat ? cat.slug.toLowerCase() : genreOrSlug.toLowerCase().trim();

      return movieStore.getAll().filter((m) =>
        m.genres.some((g) => {
          const gLower = g.toLowerCase();
          const gSlug = gLower.replace(/[^a-z0-9]+/g, '-');
          return gLower === targetName || gLower.includes(targetName) || gSlug === targetSlug;
        })
      );
    }
    return api.get(API_ENDPOINTS.MOVIES.BY_GENRE(genreOrSlug));
  },

  // Ambil data streaming (Video MP4/HLS & Subtitle)
  async getStreamingData(id: string): Promise<StreamingData> {
    if (env.USE_MOCK) {
      await delay(50);
      return movieStore.getStreamingData(id);
    }
    return api.get(API_ENDPOINTS.MOVIES.STREAM(id));
  },
};
