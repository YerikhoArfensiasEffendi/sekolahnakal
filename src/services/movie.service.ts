/**
 * Service Konten Film Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Terhubung langsung ke store katalog (tambah/edit/hapus langsung sinkron).
 */

import type { Movie, MovieDetail, StreamingData } from '@/types/movie';
import { movieStore } from './movieStore.service';
import { categoryStore } from './categoryStore.service';

export const movieService = {
  // Ambil film trending (diurutkan berdasarkan traffic / views terbanyak ke paling sedikit)
  async getTrending(): Promise<Movie[]> {
    const all = movieStore.getAll();
    return [...all].sort((a, b) => {
      const viewsA = (parseInt(localStorage.getItem(`sn_views_${a.id}`) || '0', 10) || (a.views || 0));
      const viewsB = (parseInt(localStorage.getItem(`sn_views_${b.id}`) || '0', 10) || (b.views || 0));
      if (viewsB !== viewsA) return viewsB - viewsA;
      return (b.rating || 0) - (a.rating || 0);
    });
  },

  // Ambil film terpopuler
  async getPopular(): Promise<Movie[]> {
    const all = movieStore.getAll();
    return [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  },

  // Ambil rilis terbaru (diurutkan berdasarkan tahun/terbaru)
  async getNewReleases(): Promise<Movie[]> {
    const all = movieStore.getAll();
    return [...all].sort((a, b) => (b.year || 2026) - (a.year || 2026)).slice(0, 10);
  },

  // Ambil detail film by ID (Asinkron & aman dengan server sync)
  async getById(id: string): Promise<MovieDetail> {
    return await movieStore.getByIdAsync(id);
  },

  // Pencarian film (judul, genre, overview)
  async search(query: string): Promise<Movie[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return movieStore.getAll().filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres?.some((g) => g.toLowerCase().includes(q)) ||
        (m.overview && m.overview.toLowerCase().includes(q))
    );
  },

  // Ambil berdasarkan kategori genre / slug
  async getByGenre(genreOrSlug: string): Promise<Movie[]> {
    const cat = categoryStore.getBySlug(genreOrSlug);
    const targetName = cat ? cat.name.toLowerCase() : genreOrSlug.toLowerCase().trim();
    const targetSlug = cat ? cat.slug.toLowerCase() : genreOrSlug.toLowerCase().trim();

    return movieStore.getAll().filter((m) =>
      m.genres?.some((g) => {
        const gLower = g.toLowerCase();
        const gSlug = gLower.replace(/[^a-z0-9]+/g, '-');
        return gLower === targetName || gLower.includes(targetName) || gSlug === targetSlug;
      })
    );
  },

  // Ambil data streaming (Video MP4/HLS & Subtitle)
  async getStreamingData(id: string): Promise<StreamingData> {
    return await movieStore.getStreamingData(id);
  },
};
