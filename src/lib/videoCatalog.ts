/**
 * High-Scale Video Catalog Engine
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Terhubung langsung ke movieStore (katalog dinamis upload/edit/hapus).
 */

import type { Movie } from '@/types/movie';
import { movieStore } from '@/services/movieStore.service';

// In-Memory Query Cache
const queryCache = new Map<string, { data: Movie[]; total: number; timestamp: number }>();
const CACHE_TTL_MS = 15000;

if (typeof window !== 'undefined') {
  window.addEventListener('sekolah_nakal_movies_updated', () => {
    queryCache.clear();
  });
}

export interface VideoCatalogQuery {
  page?: number;
  limit?: number;
  genre?: string;
  tier?: string;
  search?: string;
  sortBy?: 'trending' | 'popular' | 'new' | 'rating';
}

export interface PaginatedVideoResult {
  items: Movie[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function queryVideoCatalog({
  page = 1,
  limit = 20,
  genre,
  tier,
  search,
  sortBy = 'trending',
}: VideoCatalogQuery): PaginatedVideoResult {
  const cacheKey = `${page}_${limit}_${genre || 'all'}_${tier || 'all'}_${search || ''}_${sortBy}`;
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const totalPages = Math.ceil(cached.total / limit);
    return {
      items: cached.data,
      total: cached.total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  let results = [...movieStore.getAll()];

  // Tier filter (vvip, vip, talent, regular)
  if (tier && tier !== 'all') {
    const tLower = tier.toLowerCase();
    results = results.filter((m) => (m.tier || 'regular').toLowerCase() === tLower);
  }

  // Fast text filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (m) =>
        (m?.title || '').toLowerCase().includes(q) ||
        (m?.genres || []).some((g) => (g || '').toLowerCase().includes(q)) ||
        (m?.overview && m.overview.toLowerCase().includes(q))
    );
  }

  // Genre filter
  if (genre && genre !== 'all') {
    const gLower = genre.toLowerCase();
    results = results.filter((m) =>
      (m?.genres || []).some((g) => (g || '').toLowerCase() === gLower || (g || '').toLowerCase().includes(gLower))
    );
  }

  // Sorting
  switch (sortBy) {
    case 'popular':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'new':
      results.sort((a, b) => b.year - a.year);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'trending':
    default:
      // Default order
      break;
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const pageItems = results.slice(startIndex, startIndex + limit);

  // Store in cache
  if (queryCache.size > 50) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) queryCache.delete(firstKey);
  }
  queryCache.set(cacheKey, { data: pageItems, total, timestamp: Date.now() });

  return {
    items: pageItems,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}
