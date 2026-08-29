/**
 * Ad Store Service (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Mengelola konfigurasi banner iklan dinamis:
 * - Master ON/OFF Switch
 * - Slot Sayap Kiri & Kanan (160x600)
 * - Tipe: Gambar / GIF / Foto dengan Link Tujuan ATAU Embed Code / HTML / JS / Iframe
 * - Sinkronisasi lokal + backend server /api/ads.php
 */

export type AdContentType = 'image' | 'embed';

export interface AdSlotConfig {
  id: string; // 'hero-top', 'left-1', 'left-2', 'right-1', 'right-2'
  label: string;
  position: 'left' | 'right' | 'top';
  enabled: boolean;
  type: AdContentType;
  mediaUrl: string;
  targetUrl: string;
  embedCode: string;
  altText: string;
}

export interface GlobalAdSettings {
  masterEnabled: boolean;
  slots: AdSlotConfig[];
  updatedAt: string;
}

const STORAGE_KEY = 'sekolah_nakal_ads_config';
const EVENT_NAME = 'sekolah_nakal_ads_updated';

export const DEFAULT_AD_SLOTS: AdSlotConfig[] = [
  {
    id: 'hero-top',
    label: 'Banner Header Slide (Hero Atas)',
    position: 'top',
    enabled: false,
    type: 'image',
    mediaUrl: '/images/banner_promo.png',
    targetUrl: 'https://discord.com/invite/serverbokep',
    embedCode: '',
    altText: 'Official Banner Sekolah Nakal',
  },
  {
    id: 'left-1',
    label: 'Sayap Kiri - Slot 1 (Atas)',
    position: 'left',
    enabled: true,
    type: 'image',
    mediaUrl: '',
    targetUrl: 'https://discord.com/invite/serverbokep',
    embedCode: '',
    altText: 'Banner Sponsor Kiri 1',
  },
  {
    id: 'left-2',
    label: 'Sayap Kiri - Slot 2 (Bawah)',
    position: 'left',
    enabled: true,
    type: 'image',
    mediaUrl: '',
    targetUrl: 'https://t.me/+O-QKy_uVG9E4NGY9',
    embedCode: '',
    altText: 'Banner Sponsor Kiri 2',
  },
  {
    id: 'right-1',
    label: 'Sayap Kanan - Slot 1 (Atas)',
    position: 'right',
    enabled: true,
    type: 'image',
    mediaUrl: '',
    targetUrl: 'https://discord.com/invite/serverbokep',
    embedCode: '',
    altText: 'Banner Sponsor Kanan 1',
  },
  {
    id: 'right-2',
    label: 'Sayap Kanan - Slot 2 (Bawah)',
    position: 'right',
    enabled: true,
    type: 'image',
    mediaUrl: '',
    targetUrl: 'https://t.me/+O-QKy_uVG9E4NGY9',
    embedCode: '',
    altText: 'Banner Sponsor Kanan 2',
  },
];

export const DEFAULT_GLOBAL_ADS: GlobalAdSettings = {
  masterEnabled: false, // Default hidden as requested
  slots: DEFAULT_AD_SLOTS,
  updatedAt: new Date().toISOString(),
};

// Ambil konfigurasi iklan dari localStorage / defaults
export function getStoredAdSettings(): GlobalAdSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.masterEnabled === 'boolean' && Array.isArray(parsed.slots)) {
        // Merge missing slot definitions if any
        const mergedSlots = DEFAULT_AD_SLOTS.map((defSlot) => {
          const found = parsed.slots.find((s: AdSlotConfig) => s.id === defSlot.id);
          return found ? { ...defSlot, ...found } : defSlot;
        });
        return {
          masterEnabled: parsed.masterEnabled,
          slots: mergedSlots,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_GLOBAL_ADS;
}

// Simpan konfigurasi ke localStorage & broadcast event
function saveLocalAdSettings(settings: GlobalAdSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: settings }));
    }
  } catch {
    // ignore
  }
}

// Sync background dengan backend server
let hasSyncedAds = false;
export async function syncAdsFromServer(): Promise<GlobalAdSettings> {
  try {
    const res = await fetch('/api/ads.php', { method: 'GET' });
    if (res.ok) {
      const serverSettings = await res.json();
      if (serverSettings && typeof serverSettings.masterEnabled === 'boolean') {
        saveLocalAdSettings(serverSettings);
        return serverSettings;
      }
    }
  } catch {
    // offline / dev mode
  }
  return getStoredAdSettings();
}

if (typeof window !== 'undefined' && !hasSyncedAds) {
  hasSyncedAds = true;
  syncAdsFromServer();
}

export const adStore = {
  // Ambil semua pengaturan iklan
  getConfig(): GlobalAdSettings {
    return getStoredAdSettings();
  },

  // Simpan seluruh konfigurasi ke local & server
  async saveConfig(settings: GlobalAdSettings): Promise<boolean> {
    const updatedSettings: GlobalAdSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAdSettings(updatedSettings);

    try {
      await fetch('/api/ads.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Toggle master status (ON / OFF)
  async setMasterEnabled(enabled: boolean): Promise<GlobalAdSettings> {
    const current = getStoredAdSettings();
    current.masterEnabled = enabled;
    await this.saveConfig(current);
    return current;
  },

  // Update satu slot spesifik
  async updateSlot(slotId: string, updates: Partial<AdSlotConfig>): Promise<GlobalAdSettings> {
    const current = getStoredAdSettings();
    current.slots = current.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
    await this.saveConfig(current);
    return current;
  },

  // Ambil slot aktif per posisi (left / right)
  getActiveSlotsByPosition(position: 'left' | 'right'): AdSlotConfig[] {
    const config = getStoredAdSettings();
    if (!config.masterEnabled) return [];
    return config.slots.filter((s) => s.position === position && s.enabled);
  },

  // Reset ke pengaturan default
  async resetToDefaults(): Promise<GlobalAdSettings> {
    await this.saveConfig(DEFAULT_GLOBAL_ADS);
    return DEFAULT_GLOBAL_ADS;
  },
};

export const adStoreService = adStore;
