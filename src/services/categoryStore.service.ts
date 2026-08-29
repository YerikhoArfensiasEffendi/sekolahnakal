/**
 * Dynamic Category & Genre Store (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Sinkronisasi otomatis dengan Server Backend (/api/categories.php)
 * - Persisten di localStorage + Server Database
 * - Broadcast event otomatis agar semua komponen (Navbar, Footer, Browse, Studio) sinkron
 */

import type { Genre } from '@/constants/genres';

const STORAGE_KEY = 'sekolah_nakal_categories_db';
const EVENT_NAME = 'sekolah_nakal_categories_updated';

// Ambil semua kategori dari storage lokal
export function getStoredCategories(): Genre[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  return [];
}

// Simpan ke storage lokal dan picu event
function saveLocalCategories(categories: Genre[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  } catch {
    // ignore
  }
}

// Sync background dengan server
let hasSyncedCats = false;
export async function syncCategoriesFromServer(): Promise<Genre[]> {
  try {
    const res = await fetch('/api/categories.php', { method: 'GET' });
    if (res.ok) {
      const serverCats = await res.json();
      if (Array.isArray(serverCats)) {
        saveLocalCategories(serverCats);
        return serverCats;
      }
    }
  } catch {
    // offline or dev mode
  }
  return getStoredCategories();
}

if (typeof window !== 'undefined' && !hasSyncedCats) {
  hasSyncedCats = true;
  syncCategoriesFromServer();
}

export const categoryStore = {
  // Ambil semua kategori
  getAll(): Genre[] {
    return getStoredCategories();
  },

  async refreshFromServer(): Promise<Genre[]> {
    return await syncCategoriesFromServer();
  },

  // Cari berdasarkan slug
  getBySlug(slug: string): Genre | undefined {
    const all = getStoredCategories();
    return all.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  },

  // Cari berdasarkan nama
  getByName(name: string): Genre | undefined {
    const all = getStoredCategories();
    return all.find((c) => c.name.toLowerCase() === name.toLowerCase());
  },

  // Tambah kategori baru
  add(name: string, description?: string, customSlug?: string): Genre {
    const all = getStoredCategories();
    const cleanName = name.trim();
    const slug = customSlug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    let finalSlug = slug;
    let counter = 1;
    while (all.some((c) => c.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const newCategory: Genre = {
      id: String(Date.now()),
      name: cleanName,
      slug: finalSlug,
      description: description?.trim() || `Koleksi konten video bertema ${cleanName}.`,
    };

    const updated = [...all, newCategory];
    saveLocalCategories(updated);

    fetch('/api/categories.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: updated }),
    }).catch(() => {});

    return newCategory;
  },

  // Update kategori yang ada
  update(id: string, updates: Partial<Omit<Genre, 'id'>>): Genre | null {
    const all = getStoredCategories();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = all[index]!;
    const updatedCategory: Genre = {
      ...existing,
      ...updates,
      id,
    };

    if (updates.name && !updates.slug) {
      updatedCategory.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    all[index] = updatedCategory;
    saveLocalCategories(all);

    fetch('/api/categories.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: all }),
    }).catch(() => {});

    return updatedCategory;
  },

  // Hapus kategori
  delete(id: string): boolean {
    const all = getStoredCategories();
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length !== all.length) {
      saveLocalCategories(filtered);
      fetch('/api/categories.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: filtered }),
      }).catch(() => {});
      return true;
    }
    return false;
  },
};
