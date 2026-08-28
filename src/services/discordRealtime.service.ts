/**
 * Discord Real-time Scraper & Admin Logger Service (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 */

export interface DiscordChannelInfo {
  id: string;
  name: string;
  cleanCategory: string;
  parentId: string | null;
  parentName: string;
  detectedTier: 'regular' | 'vip' | 'vvip';
  position: number;
  isLikelyMedia: boolean;
  nsfw: boolean;
}

export interface DiscordSyncLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'upload';
  message: string;
  meta?: Record<string, unknown>;
}

export interface DiscordSyncResult {
  success: boolean;
  timestamp: string;
  totalScannedChannels: number;
  totalMessagesChecked: number;
  totalNewVideosPublished: number;
  syncedItems: Array<{
    id: string;
    title: string;
    genres: string[];
    tier: string;
    videoUrl: string;
  }>;
}

export const discordRealtimeService = {
  // Ambil daftar text channel dari Discord Guild
  async getChannels(): Promise<{ success: boolean; channels: DiscordChannelInfo[]; total: number; mediaCount: number }> {
    try {
      const res = await fetch('/api/discord.php?action=get_channels');
      if (res.ok) {
        return await res.json();
      }
      return { success: false, channels: [], total: 0, mediaCount: 0 };
    } catch {
      return { success: false, channels: [], total: 0, mediaCount: 0 };
    }
  },

  // Trigger Real-time Polling / Sinkronisasi instan
  async pollRealtime(): Promise<DiscordSyncResult> {
    try {
      const res = await fetch('/api/discord.php?action=poll_realtime');
      if (res.ok) {
        const data = await res.json();
        if (data.totalNewVideosPublished > 0) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sekolah_nakal_movies_updated'));
            window.dispatchEvent(new CustomEvent('sekolah_nakal_categories_updated'));
          }
        }
        return data;
      }
      return {
        success: false,
        timestamp: new Date().toISOString(),
        totalScannedChannels: 0,
        totalMessagesChecked: 0,
        totalNewVideosPublished: 0,
        syncedItems: [],
      };
    } catch {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        totalScannedChannels: 0,
        totalMessagesChecked: 0,
        totalNewVideosPublished: 0,
        syncedItems: [],
      };
    }
  },

  // Ambil Live Activity Logs untuk Konsol Admin
  async getLogs(): Promise<{ success: boolean; logs: DiscordSyncLog[]; count: number }> {
    try {
      const res = await fetch('/api/discord.php?action=get_logs');
      if (res.ok) {
        return await res.json();
      }
      return { success: false, logs: [], count: 0 };
    } catch {
      return { success: false, logs: [], count: 0 };
    }
  },

  // Bersihkan riwayat log
  async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch('/api/discord.php?action=clear_logs', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Scrape spesifik channel manual
  async scrapeChannel(channelId: string, limit = 20): Promise<{ success: boolean; publishedCount: number; category: string; tier: string }> {
    try {
      const res = await fetch(`/api/discord.php?action=scrape_channel&channel_id=${channelId}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.publishedCount > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sekolah_nakal_movies_updated'));
          window.dispatchEvent(new CustomEvent('sekolah_nakal_categories_updated'));
        }
        return data;
      }
      return { success: false, publishedCount: 0, category: '', tier: 'regular' };
    } catch {
      return { success: false, publishedCount: 0, category: '', tier: 'regular' };
    }
  },
};
