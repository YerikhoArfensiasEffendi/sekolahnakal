/**
 * Database & Store Konten Film Dinamis (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Sinkronisasi otomatis ke Server Backend (/api/movies.php & /api/upload.php & /api/lulustream.php)
 * - Dukungan penyimpanan Lulustream Cloud & Server Lokal
 * - Persisten di localStorage + Server Database JSON
 * - Broadcast event otomatis agar UI langsung update pas video diunggah
 */

import type { Movie, MovieDetail, StreamingData, VideoTier } from '@/types/movie';
import { mockMovies, getMockMovieDetail, getMockStreamingData } from '@/mock/movies';
import { videoStorageService } from './videoStorage.service';
import { getDirectStreamUrl } from '@/utils/videoEmbed';

const STORAGE_KEY = 'sekolah_nakal_movies_db';
const EVENT_NAME = 'sekolah_nakal_movies_updated';
const LULUSTREAM_KEY_STORAGE = 'sn_lulustream_api_key';
const ZEROSTORAGE_KEY_STORAGE = 'sn_zerostorage_api_key';
const STORAGE_PREF_KEY = 'sn_storage_provider_pref'; // 'zerostorage' | 'lulustream' | 'local'

let inMemoryMovies: Movie[] = [];
let hasInitialSynced = false;
let isSyncingPromise: Promise<Movie[]> | null = null;

function normalizeMovieItem(m: any): Movie {
  const cleanRating = (m.rating === 8.0 || m.rating === 9.6 || m.rating === 8) ? 0 : (m.rating || 0);
  const rawGenres = Array.isArray(m.genres) && m.genres.length > 0
    ? m.genres
    : (m.category ? [m.category] : (Array.isArray(m.tags) && m.tags.length > 0 ? [m.tags[0]] : ['Tidur']));
  const cleanGenres = rawGenres.filter(
    (g: string) => typeof g === 'string' && g.toLowerCase().trim() !== 'romance & sensual'
  );
  const poster = m.posterUrl || m.poster || '/images/logo_v2.png';
  const backdrop = m.backdropUrl || m.banner || poster;
  const overview = m.overview || m.description || '';
  const durationMin = typeof m.duration === 'number' && m.duration > 400 ? Math.max(1, Math.round(m.duration / 60)) : (m.duration || 60);

  return {
    ...m,
    posterUrl: poster,
    backdropUrl: backdrop,
    overview: overview,
    duration: durationMin,
    rating: cleanRating,
    genres: cleanGenres.length > 0 ? cleanGenres : ['Tidur'],
  };
}

export function getStoredMovies(): Movie[] {
  if (inMemoryMovies.length > 0) {
    return inMemoryMovies;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryMovies = parsed.map(normalizeMovieItem);
        return inMemoryMovies;
      }
    }
  } catch {
    // fallback
  }

  return [];
}

function saveLocalMovies(movies: Movie[], broadcast: boolean = true): void {
  const normalized = movies.map(normalizeMovieItem);
  inMemoryMovies = normalized;

  try {
    const serialized = JSON.stringify(normalized);
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing === serialized) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // localStorage quota exceeded fallback: clear old bloated key
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  if (broadcast && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export async function syncMoviesFromServer(): Promise<Movie[]> {
  if (isSyncingPromise) return isSyncingPromise;

  isSyncingPromise = (async () => {
    try {
      const res = await fetch(`/api/movies.php?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const serverMovies = await res.json();
        if (Array.isArray(serverMovies)) {
          saveLocalMovies(serverMovies);
          return inMemoryMovies;
        }
      }
    } catch {
      // offline or local dev
    } finally {
      isSyncingPromise = null;
    }
    return getStoredMovies();
  })();

  return isSyncingPromise;
}

if (typeof window !== 'undefined' && !hasInitialSynced) {
  hasInitialSynced = true;
  syncMoviesFromServer();
}

export const movieStore = {
  getAll(): Movie[] {
    return getStoredMovies();
  },

  async refreshFromServer(): Promise<Movie[]> {
    return await syncMoviesFromServer();
  },

  getById(id: string): MovieDetail {
    const all = getStoredMovies();
    const movie = all.find((m) => m.id === id);
    if (!movie) {
      return getMockMovieDetail(id);
    }

    const rawTier = ((movie.tier as string) || 'regular').toLowerCase().trim();
    const safeTier: VideoTier = rawTier === 'vip' || rawTier === 'vvip' || rawTier === 'talent' ? (rawTier as VideoTier) : 'regular';

    return {
      ...movie,
      tier: safeTier,
      director: 'Official Sekolah Nakal Studio',
      cast: ['Talent Verified', 'Special Guest', 'Official Cast'],
      maturityRating: '18+',
      language: 'Indonesia',
      releaseDate: `${movie.year || 2026}-06-15`,
      similarMovies: all.filter((m) => m.id !== id && m.genres?.some((g) => movie.genres?.includes(g))).slice(0, 6),
    };
  },

  async getByIdAsync(id: string): Promise<MovieDetail> {
    let all = getStoredMovies();
    let movie = all.find((m) => m.id === id);
    if (!movie) {
      all = await syncMoviesFromServer();
      movie = all.find((m) => m.id === id);
    }
    if (!movie) {
      try {
        const res = await fetch(`/api/movies.php?id=${encodeURIComponent(id)}&_t=${Date.now()}`);
        if (res.ok) {
          const single = await res.json();
          if (single && single.id) {
            movie = single;
          }
        }
      } catch {}
    }
    if (!movie) {
      return getMockMovieDetail(id);
    }

    const rawTier = ((movie.tier as string) || 'regular').toLowerCase().trim();
    const safeTier: VideoTier = rawTier === 'vip' || rawTier === 'vvip' || rawTier === 'talent' ? (rawTier as VideoTier) : 'regular';

    return {
      ...movie,
      tier: safeTier,
      director: 'Official Sekolah Nakal Studio',
      cast: ['Talent Verified', 'Special Guest', 'Official Cast'],
      maturityRating: '18+',
      language: 'Indonesia',
      releaseDate: `${movie.year || 2026}-06-15`,
      similarMovies: all.filter((m) => m.id !== id && m.genres?.some((g) => movie.genres?.includes(g))).slice(0, 6),
    };
  },

  // Pengaturan Provider Storage (ZeroStorage / Lulustream Cloud / Auto)
  getStorageProvider(): 'zerostorage' | 'lulustream' | 'auto' {
    return (localStorage.getItem(STORAGE_PREF_KEY) as 'zerostorage' | 'lulustream' | 'auto') || 'zerostorage';
  },

  setStorageProvider(provider: 'zerostorage' | 'lulustream' | 'auto'): void {
    localStorage.setItem(STORAGE_PREF_KEY, provider);
  },

  // Ambil & Simpan ZeroStorage.net API Key
  getZeroStorageApiKey(): string {
    return localStorage.getItem(ZEROSTORAGE_KEY_STORAGE) || 'sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3';
  },

  async saveZeroStorageApiKey(apiKey: string): Promise<boolean> {
    localStorage.setItem(ZEROSTORAGE_KEY_STORAGE, apiKey.trim());
    try {
      await fetch('/api/zerostorage.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      return true;
    } catch {
      return true;
    }
  },

  async fetchZeroStorageServerConfig(): Promise<{ hasApiKey: boolean; apiKey?: string }> {
    try {
      const res = await fetch('/api/zerostorage.php?action=get_config');
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          localStorage.setItem(ZEROSTORAGE_KEY_STORAGE, data.apiKey);
        }
        return data;
      }
    } catch {}
    const localKey = this.getZeroStorageApiKey();
    return { hasApiKey: !!localKey, apiKey: localKey };
  },

  // Ambil & Simpan Lulustream API Key
  getLulustreamApiKey(): string {
    return localStorage.getItem(LULUSTREAM_KEY_STORAGE) || '';
  },

  async saveLulustreamApiKey(apiKey: string): Promise<boolean> {
    localStorage.setItem(LULUSTREAM_KEY_STORAGE, apiKey.trim());
    try {
      await fetch('/api/lulustream.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      return true;
    } catch {
      return true;
    }
  },

  async fetchLulustreamServerConfig(): Promise<{ hasApiKey: boolean; apiKey?: string }> {
    try {
      const res = await fetch('/api/lulustream.php?action=get_config');
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          localStorage.setItem(LULUSTREAM_KEY_STORAGE, data.apiKey);
        }
        return data;
      }
    } catch {}
    const localKey = this.getLulustreamApiKey();
    return { hasApiKey: !!localKey, apiKey: localKey };
  },

  // Direct client-side upload ke upload.zerostorage.net (Bypass limit PHP hostinger)
  async uploadVideoToZeroStorageDirect(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      const key = this.getZeroStorageApiKey();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://upload.zerostorage.net/api/upload/universal', true);
      xhr.setRequestHeader('x-api-key', key);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && (data.embedUrl || data.fileId || data.viewUrl)) {
              let embedUrl = data.embedUrl;
              if (!embedUrl && data.fileId) {
                embedUrl = `https://zerostorage.net/embed/${data.fileId}`;
              } else if (!embedUrl && data.viewUrl) {
                embedUrl = data.viewUrl.replace('/watch/', '/embed/');
              }
              resolve({ success: true, url: embedUrl, fileId: data.fileId });
              return;
            }
            if (data.error) {
              resolve({ success: false, error: data.error });
              return;
            }
          } catch {
            resolve({ success: false, error: 'Gagal membaca format respons dari ZeroStorage.' });
            return;
          }
        }
        resolve({
          success: false,
          error: `Gagal direct upload ZeroStorage (HTTP ${xhr.status}). Pastikan API Key valid dan file tidak corrupt.`,
        });
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          error: 'Koneksi direct upload ke ZeroStorage.net terputus.',
        });
      };

      xhr.send(formData);
    });
  },

  // Upload video langsung ke ZeroStorage.net (Direct Client Cloud CDN Upload)
  async uploadVideoToZeroStorage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
    return this.uploadVideoToZeroStorageDirect(file, onProgress);
  },

  // Upload video ke Lulustream Cloud
  async uploadVideoToLulustream(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url?: string; fileCode?: string; error?: string }> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('video', file);
      const key = this.getLulustreamApiKey();
      if (key) {
        formData.append('apiKey', key);
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/lulustream.php?action=upload', true);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.url) {
              resolve({ success: true, url: data.url, fileCode: data.fileCode });
              return;
            }
            if (data.error) {
              resolve({ success: false, error: data.error });
              return;
            }
          } catch {}
        }
        resolve({
          success: false,
          error: `Gagal upload ke Lulustream (Status: ${xhr.status}). Periksa koneksi atau API Key.`,
        });
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          error: 'Koneksi ke endpoint Lulustream gagal.',
        });
      };

      xhr.send(formData);
    });
  },

  // Upload video file fleksibel (Pilih: ZeroStorage / Lulustream / Auto)
  async uploadVideoToServer(
    file: File,
    onProgress?: (percent: number) => void,
    onStatusUpdate?: (status: string) => void,
    targetProvider?: 'zerostorage' | 'lulustream' | 'auto'
  ): Promise<{ success: boolean; url?: string; filename?: string; error?: string; storage?: 'zerostorage' | 'lulustream' }> {
    const provider = targetProvider || this.getStorageProvider();

    // 1. Target Khusus: Lulustream Cloud
    if (provider === 'lulustream') {
      onStatusUpdate?.('Mengunggah ke Lulustream Cloud (Auto-HLS)...');
      const luluRes = await this.uploadVideoToLulustream(file, onProgress);
      if (luluRes.success && luluRes.url) {
        return {
          success: true,
          url: luluRes.url,
          filename: file.name,
          storage: 'lulustream',
        };
      }
      return {
        success: false,
        error: luluRes.error || 'Gagal mengunggah video ke Lulustream Cloud. Periksa API Key Anda.',
      };
    }

    // 2. Target Khusus: ZeroStorage.net Cloud
    if (provider === 'zerostorage') {
      onStatusUpdate?.('Mengunggah ke ZeroStorage.net Cloud (High Speed CDN)...');
      const zeroRes = await this.uploadVideoToZeroStorage(file, onProgress);
      if (zeroRes.success && zeroRes.url) {
        return {
          success: true,
          url: zeroRes.url,
          filename: file.name,
          storage: 'zerostorage',
        };
      }
      return {
        success: false,
        error: zeroRes.error || 'Gagal mengunggah video ke ZeroStorage.net Cloud.',
      };
    }

    // 3. Mode Auto Failover: Coba ZeroStorage dulu, jika gagal pindah ke LuluStream
    onStatusUpdate?.('Mengunggah ke ZeroStorage.net Cloud (Mode Auto)...');
    const zeroRes = await this.uploadVideoToZeroStorage(file, onProgress);
    if (zeroRes.success && zeroRes.url) {
      return {
        success: true,
        url: zeroRes.url,
        filename: file.name,
        storage: 'zerostorage',
      };
    }

    const luluKey = this.getLulustreamApiKey();
    if (luluKey) {
      onStatusUpdate?.('⚠️ ZeroStorage error -> Mencoba failover ke Lulustream Cloud...');
      onProgress?.(5);
      const luluRes = await this.uploadVideoToLulustream(file, onProgress);
      if (luluRes.success && luluRes.url) {
        return {
          success: true,
          url: luluRes.url,
          filename: file.name,
          storage: 'lulustream',
        };
      }
    }

    return {
      success: false,
      error: zeroRes.error || 'Gagal mengunggah video ke cloud storage.',
    };
  },

  // Tambah film baru
  add(data: Omit<Movie, 'id' | 'slug'> & { slug?: string; videoUrl?: string }): Movie {
    const all = getStoredMovies();
    const newId = String(Date.now());
    const newMovie: Movie = {
      ...data,
      id: newId,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      year: data.year || new Date().getFullYear(),
      duration: data.duration || 120,
      rating: data.rating || 8.0,
      genres: data.genres && data.genres.length > 0 ? data.genres : ['Umum'],
      tier: data.tier || 'regular',
      overview: data.overview || `${data.title} adalah sebuah konten eksklusif Sekolah Nakal.`,
      posterUrl: data.posterUrl || data.backdropUrl || '/images/logo_v2.png',
      backdropUrl: data.backdropUrl || data.posterUrl || '/images/logo_v2.png',
    };

    if (data.videoUrl) {
      try {
        localStorage.setItem(`sn_video_url_${newId}`, data.videoUrl);
      } catch {}
    }

    const updated = [newMovie, ...all];
    saveLocalMovies(updated);

    fetch('/api/movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMovie),
    }).catch(() => {});

    return newMovie;
  },

  // Edit film yang sudah ada
  update(id: string, updates: Partial<Movie> & { videoUrl?: string }): Movie | null {
    const all = getStoredMovies();
    const index = all.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const existing = all[index]!;
    const updatedMovie: Movie = {
      ...existing,
      ...updates,
      id,
    };

    if (updates.videoUrl) {
      try {
        localStorage.setItem(`sn_video_url_${id}`, updates.videoUrl);
      } catch {}
    }

    all[index] = updatedMovie;
    saveLocalMovies(all);

    fetch('/api/movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMovie),
    }).catch(() => {});

    return updatedMovie;
  },

  // Hapus film
  delete(id: string): boolean {
    const all = getStoredMovies();
    const filtered = all.filter((m) => m.id !== id);
    if (filtered.length !== all.length) {
      saveLocalMovies(filtered);
      try {
        localStorage.removeItem(`sn_video_url_${id}`);
      } catch {}

      fetch(`/api/movies.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});

      return true;
    }
    return false;
  },

  resetToDefaults(): void {
    const defaults = mockMovies.all;
    saveLocalMovies(defaults);
    fetch('/api/movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: defaults }),
    }).catch(() => {});
  },

  clearAll(): void {
    saveLocalMovies([]);
    fetch('/api/movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: [] }),
    }).catch(() => {});
  },

  exportBackupJson(): string {
    const all = getStoredMovies();
    return JSON.stringify(all, null, 2);
  },

  importBackupJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'Format JSON harus berupa array daftar film.' };
      }
      saveLocalMovies(parsed);
      fetch('/api/movies.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: parsed }),
      }).catch(() => {});
      return { success: true, count: parsed.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Gagal membaca format file JSON.' };
    }
  },

  async getStreamingData(id: string): Promise<StreamingData> {
    const detail = await this.getByIdAsync(id);
    let videoStream = detail?.videoUrl?.trim() || '';

    // Jika videoUrl tidak ada atau berupa blob usang, coba cari dari IndexedDB / localStorage
    if (!videoStream || videoStream.startsWith('blob:')) {
      const blobUrl = await videoStorageService.getVideoUrl(id);
      const customUrl = localStorage.getItem(`sn_video_url_${id}`) || '';
      videoStream = blobUrl || (customUrl && !customUrl.startsWith('blob:') ? customUrl : '') || videoStream;
    }

    if (videoStream) {
      videoStream = getDirectStreamUrl(videoStream);
      return {
        sources: [
          {
            type: videoStream.includes('.m3u8') ? 'hls' : 'mp4',
            url: videoStream,
            quality: '1080p',
          },
        ],
        subtitles: [
          {
            label: 'Indonesia',
            language: 'id',
            url: '/subtitles/sample-id.vtt',
            default: true,
          },
        ],
        poster: detail.backdropUrl || detail.posterUrl,
        title: detail.title,
        duration: detail.duration,
      };
    }

    return getMockStreamingData(id);
  },

  getVideoUrl(id: string): string {
    const detail = this.getById(id);
    return detail.videoUrl || localStorage.getItem(`sn_video_url_${id}`) || '';
  },

  getByTier(tier: VideoTier): Movie[] {
    return getStoredMovies().filter((m) => (m.tier || 'regular') === tier);
  },
};
