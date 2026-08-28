/**
 * State Gatekeeper Sinkronisasi Discord Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface SiteGateContextValue {
  isUnlocked: boolean;
  unlockWithDiscord: (roleName: string, username?: string) => void;
  unlockAsGuest: () => void;
  lock: () => void;
}

const SiteGateContext = createContext<SiteGateContextValue | null>(null);

const STORAGE_KEY = 'sekolah_nakal_gate_unlocked';

export function SiteGateProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isUnlocked) {
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [isUnlocked]);

  // Dengarkan event storage dari tab / popup lain secara realtime
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsUnlocked(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const unlockWithDiscord = useCallback((_roleName: string, _username?: string) => {
    setIsUnlocked(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const unlockAsGuest = useCallback(() => {
    setIsUnlocked(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <SiteGateContext.Provider value={{ isUnlocked, unlockWithDiscord, unlockAsGuest, lock }}>
      {children}
    </SiteGateContext.Provider>
  );
}

export function useSiteGate(): SiteGateContextValue {
  const context = useContext(SiteGateContext);
  if (!context) {
    throw new Error('useSiteGate harus digunakan di dalam SiteGateProvider');
  }
  return context;
}
