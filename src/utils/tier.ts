import type { VideoTier } from '@/types/movie';

export interface DiscordAccount {
  id: string;
  username: string;
  avatarUrl: string;
  roles: string[];
  tier: VideoTier;
  syncedAt: string;
}

export interface UserTierState {
  tier: VideoTier;
  discordUsername?: string;
  discordToken?: string;
  unlockedAt?: string;
}

const TIER_STORAGE_KEY = 'sekolah_nakal_user_tier';
const DISCORD_ACCOUNT_KEY = 'sekolah_nakal_discord_account';
export const DISCORD_BOT_INVITE_URL = 'https://discord.com/invite/serverbokep';
export const TELEGRAM_INVITE_URL = 'https://t.me/+O-QKy_uVG9E4NGY9';

export function getSavedUserTier(): VideoTier {
  try {
    const raw = localStorage.getItem(TIER_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.tier || 'regular';
    }
  } catch {
    // fallback
  }
  return 'regular';
}

export function saveUserTier(tier: VideoTier, discordUsername?: string, token?: string): void {
  try {
    const payload: UserTierState = {
      tier,
      discordUsername: discordUsername || `Discord#${Math.floor(1000 + Math.random() * 9000)}`,
      discordToken: token,
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem(TIER_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getSavedDiscordAccount(): DiscordAccount | null {
  try {
    const raw = localStorage.getItem(DISCORD_ACCOUNT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...parsed,
          roles: Array.isArray(parsed.roles) ? parsed.roles : [],
        };
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export function saveDiscordAccount(account: DiscordAccount): void {
  try {
    const safeAccount: DiscordAccount = {
      ...account,
      roles: Array.isArray(account.roles) ? account.roles : [],
    };
    localStorage.setItem(DISCORD_ACCOUNT_KEY, JSON.stringify(safeAccount));
    saveUserTier(safeAccount.tier, safeAccount.username);
  } catch {
    // ignore
  }
}

export function clearDiscordAccount(): void {
  try {
    localStorage.removeItem(DISCORD_ACCOUNT_KEY);
    clearUserTier();
  } catch {
    // ignore
  }
}

export function clearUserTier(): void {
  try {
    localStorage.removeItem(TIER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function canAccessTier(userTier: VideoTier = 'regular', requiredTier?: VideoTier): boolean {
  if (!requiredTier || requiredTier === 'regular') return true;
  if (userTier === 'vvip') return true; // VVIP has master access to all tiers
  if (userTier === requiredTier) return true;
  return false;
}

export function resolveTierFromDiscordRoles(roles?: string[]): VideoTier {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return 'regular';
  const upperRoles = roles.map((r) => String(r || '').toUpperCase());
  if (
    upperRoles.some(
      (r) =>
        r.includes('ADMIN') ||
        r.includes('OWNER') ||
        r.includes('DEV') ||
        r.includes('VVIP') ||
        r.includes('BOOSTER') ||
        r.includes('FOUNDER')
    )
  ) {
    return 'vvip';
  }
  if (
    upperRoles.some(
      (r) =>
        r.includes('TALENT') ||
        r.includes('TELENT') ||
        r.includes('CREATOR') ||
        r.includes('KREATOR') ||
        r.includes('UPLOADER')
    )
  ) {
    return 'talent';
  }
  if (upperRoles.some((r) => r.includes('VIP') || r.includes('PREMIUM') || r.includes('DONATOR'))) {
    return 'vip';
  }
  return 'regular';
}

export function hasUploadAccessFromRoles(roles?: string[]): boolean {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return false;
  const upper = roles.map((r) => String(r || '').toUpperCase());
  return upper.some(
    (r) =>
      r.includes('ENGINEER') ||
      r.includes('1491386462518775938')
  );
}

export function verifyDiscordToken(token: string): { success: boolean; tier?: VideoTier; message: string } {
  const clean = token.trim().toUpperCase();

  if (!clean) {
    return { success: false, message: 'Silakan masukkan token bot Discord!' };
  }

  // VVIP tokens
  if (clean.includes('VVIP') || clean === 'SN-VVIP' || clean === 'VVIP2024' || clean === 'BOSS') {
    saveUserTier('vvip', undefined, clean);
    return { success: true, tier: 'vvip', message: 'Selamat! Akses EXCLUSIF VVIP berhasil diaktifkan.' };
  }

  // VIP tokens
  if (clean.includes('VIP') || clean === 'SN-VIP' || clean === 'VIP2024') {
    saveUserTier('vip', undefined, clean);
    return { success: true, tier: 'vip', message: 'Selamat! Akses EXCLUSIF VIP berhasil diaktifkan.' };
  }

  // TALENT tokens
  if (clean.includes('TALENT') || clean.includes('TELENT') || clean === 'SN-TALENT') {
    saveUserTier('talent', undefined, clean);
    return { success: true, tier: 'talent', message: 'Selamat! Akses EXCLUSIF TALENT berhasil diaktifkan.' };
  }

  // General token accepted for VIP
  if (clean === 'SEKOLAHNAKAL' || clean === '1234') {
    saveUserTier('vip', undefined, clean);
    return { success: true, tier: 'vip', message: 'Selamat! Akses VIP berhasil diaktifkan.' };
  }

  return {
    success: false,
    message: 'Token Discord tidak valid atau telah kedaluwarsa. Dapatkan token resmi di server Discord Sekolah Nakal.',
  };
}

export function getTierBadgeConfig(tier: VideoTier = 'regular') {
  switch (tier) {
    case 'vvip':
      return {
        label: 'EXCLUSIF VVIP',
        shortLabel: 'VVIP',
        iconType: 'crown' as const,
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/40 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wider',
        borderGlow: 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        color: '#f59e0b',
      };
    case 'vip':
      return {
        label: 'EXCLUSIF VIP',
        shortLabel: 'VIP',
        iconType: 'star' as const,
        badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/40 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wider',
        borderGlow: 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        color: '#a855f7',
      };
    case 'talent':
      return {
        label: 'EXCLUSIF TALENT',
        shortLabel: 'TALENT',
        iconType: 'diamond' as const,
        badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wider',
        borderGlow: 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
        color: '#06b6d4',
      };
    default:
      return {
        label: 'REGULER',
        shortLabel: 'REGULER',
        iconType: 'user' as const,
        badgeClass: 'bg-bg-surface text-white border-border/50 rounded px-2 py-0.5 text-[11px] font-medium',
        borderGlow: 'border-border/40',
        color: '#9ca3af',
      };
  }
}
