import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types/user';
import type { VideoTier } from '@/types/movie';
import type { LoginCredentials, RegisterData } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';
import {
  getOrCreateDeviceId,
  getSavedProfileName,
  saveProfileName,
  getSavedAvatar,
  saveAvatar,
  clearDeviceSession,
} from '@/utils/device';
import {
  getSavedUserTier,
  saveUserTier,
  clearUserTier,
  verifyDiscordToken,
  canAccessTier,
  getSavedDiscordAccount,
  saveDiscordAccount,
  clearDiscordAccount,
  resolveTierFromDiscordRoles,
  type DiscordAccount,
} from '@/utils/tier';

interface AuthContextValue {
  user: User | null;
  deviceId: string;
  tier: VideoTier;
  discordAccount: DiscordAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateProfile: (data: { name: string; avatarUrl?: string }) => void;
  syncDiscord: (roleName: string, customUsername?: string) => { success: boolean; tier: VideoTier; message: string };
  applyVerifiedDiscordAccount: (account: DiscordAccount, tier: VideoTier) => void;
  disconnectDiscord: () => void;
  upgradeTier: (token: string) => { success: boolean; tier?: VideoTier; message: string };
  setDirectTier: (tier: VideoTier) => void;
  hasAccessToTier: (requiredTier?: VideoTier) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  resetToDeviceUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [tier, setTier] = useState<VideoTier>(() => getSavedUserTier());
  const [discordAccount, setDiscordAccount] = useState<DiscordAccount | null>(() => getSavedDiscordAccount());
  const [user, setUser] = useState<User>(() => {
    const id = getOrCreateDeviceId();
    const name = getSavedProfileName();
    const avatar = getSavedAvatar();
    return {
      id,
      email: `${id.toLowerCase()}@device.sekolahnakal`,
      name,
      avatarUrl: avatar,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize token getter for API requests
  useEffect(() => {
    api.setTokenGetter(() => `device-token-${deviceId}`);
  }, [deviceId]);

  // Realtime cross-tab / popup synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sekolah_nakal_user_tier') {
        setTier(getSavedUserTier());
      }
      if (e.key === 'sekolah_nakal_discord_account') {
        const acc = getSavedDiscordAccount();
        setDiscordAccount(acc);
        if (acc?.username) {
          setUser((prev) => ({
            ...prev,
            name: acc.username,
            avatarUrl: acc.avatarUrl || prev.avatarUrl,
          }));
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateProfile = useCallback(
    ({ name, avatarUrl }: { name: string; avatarUrl?: string }) => {
      if (name.trim()) {
        saveProfileName(name.trim());
      }
      if (avatarUrl) {
        saveAvatar(avatarUrl);
      }
      setUser((prev) => ({
        ...prev,
        name: name.trim() || prev.name,
        avatarUrl: avatarUrl || prev.avatarUrl,
      }));
    },
    []
  );

  const syncDiscord = useCallback((roleName: string, customUsername?: string) => {
    const username = customUsername?.trim() || `DiscordMember#${Math.floor(1000 + Math.random() * 9000)}`;
    const roles = [roleName];
    const detectedTier = resolveTierFromDiscordRoles(roles);

    const account: DiscordAccount = {
      id: `discord-${Math.floor(100000 + Math.random() * 900000)}`,
      username,
      avatarUrl: '/images/logo.png',
      roles,
      tier: detectedTier,
      syncedAt: new Date().toISOString(),
    };

    saveDiscordAccount(account);
    setDiscordAccount(account);
    setTier(detectedTier);

    // Sinkronisasi otomatis ke gateway Bot Discord resmi
    try {
      fetch('/api/discord.php?action=verify_member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, roleName }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.success && res.account) {
            const updatedAccount: DiscordAccount = {
              ...account,
              ...res.account,
              avatarUrl: res.account.avatarUrl || account.avatarUrl,
            };
            saveDiscordAccount(updatedAccount);
            setDiscordAccount(updatedAccount);
            if (res.tier) {
              setTier(res.tier);
            }
          }
        })
        .catch(() => {});
    } catch {
      // ignore
    }

    return {
      success: true,
      tier: detectedTier,
      message: `Akun Discord @${username} berhasil terhubung dengan Bot Resmi!`,
    };
  }, []);

  const applyVerifiedDiscordAccount = useCallback((account: DiscordAccount, detectedTier: VideoTier) => {
    const safeAccount: DiscordAccount = {
      ...account,
      roles: Array.isArray(account.roles) ? account.roles : [],
    };
    saveDiscordAccount(safeAccount);
    saveUserTier(detectedTier);
    setDiscordAccount(safeAccount);
    setTier(detectedTier);
    if (safeAccount.username) {
      saveProfileName(safeAccount.username);
    }
    if (safeAccount.avatarUrl) {
      saveAvatar(safeAccount.avatarUrl);
    }
    setUser((prev) => ({
      ...prev,
      name: safeAccount.username || prev.name,
      avatarUrl: safeAccount.avatarUrl || prev.avatarUrl,
    }));
  }, []);

  const disconnectDiscord = useCallback(() => {
    try {
      sessionStorage.removeItem('sekolah_nakal_gate_unlocked');
    } catch {
      // ignore
    }
    clearDiscordAccount();
    setDiscordAccount(null);
    setTier('regular');
    window.location.reload();
  }, []);

  const upgradeTier = useCallback((token: string) => {
    const result = verifyDiscordToken(token);
    if (result.success && result.tier) {
      setTier(result.tier);
    }
    return result;
  }, []);

  const setDirectTier = useCallback((newTier: VideoTier) => {
    saveUserTier(newTier);
    setTier(newTier);
  }, []);

  const hasAccessToTier = useCallback(
    (requiredTier?: VideoTier) => {
      return canAccessTier(tier, requiredTier);
    },
    [tier]
  );

  const resetToDeviceUser = useCallback(() => {
    const id = getOrCreateDeviceId();
    const name = getSavedProfileName();
    const avatar = getSavedAvatar();
    clearUserTier();
    clearDiscordAccount();
    setDiscordAccount(null);
    setTier('regular');
    setUser({
      id,
      email: `${id.toLowerCase()}@device.sekolahnakal`,
      name,
      avatarUrl: avatar,
      role: 'user',
      createdAt: new Date().toISOString(),
    });
    sessionStorage.removeItem('auth-token');
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      sessionStorage.setItem('auth-token', response.token);
      api.setTokenGetter(() => response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      sessionStorage.setItem('auth-token', response.token);
      api.setTokenGetter(() => response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearDeviceSession();
    resetToDeviceUser();
  }, [resetToDeviceUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        deviceId,
        tier,
        discordAccount,
        isAuthenticated: true, // Always authenticated via Device ID
        isLoading,
        updateProfile,
        syncDiscord,
        applyVerifiedDiscordAccount,
        disconnectDiscord,
        upgradeTier,
        setDirectTier,
        hasAccessToTier,
        login,
        register,
        logout,
        resetToDeviceUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
