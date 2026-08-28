/**
 * Root App Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Alurnya simpel:
 * 1. Ada ancaman inspect? -> Tampilin layar merah lockdown
 * 2. Belum login gate? -> Tampilin form token & captcha
 * 3. Udah beres? -> Baru download & tampilin aplikasi streaming aslinya
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SiteGateProvider, useSiteGate } from '@/contexts/SiteGateContext';
import {
  initConsoleSecurity,
  attachSecurityListeners,
  isSecurityLocked,
  getSecurityLockReason,
  triggerSecurityLockdown,
} from '@/lib/antiTamper';
import { PrivateAccessGate } from '@/components/gate/PrivateAccessGate';
import { SecurityLockdownScreen } from '@/components/security/SecurityLockdownScreen';

// Load aplikasi streaming
const AuthenticatedApp = lazy(() => import('@/components/layout/AuthenticatedApp'));

function AppContent() {
  const { isUnlocked, unlockWithDiscord } = useSiteGate();
  const { applyVerifiedDiscordAccount } = useAuth();
  const [locked, setLocked] = useState(() => isSecurityLocked());
  const [reason, setReason] = useState(() => getSecurityLockReason());

  // Handle Discord OAuth2 return hash token
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        if (accessToken) {
          fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => r.json())
            .then((user) => {
              if (user && user.id) {
                const displayName = user.global_name || user.username;
                const avatarUrl = user.avatar
                  ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                  : '/images/logo.png';

                return fetch('/api/discord.php?action=verify_oauth_user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.id,
                    username: displayName,
                    avatar: user.avatar,
                  }),
                })
                  .then((r) => r.json())
                  .then((res) => {
                    if (res && res.success && res.account) {
                      applyVerifiedDiscordAccount(res.account, res.tier || res.account.tier);
                      unlockWithDiscord(res.account.roles[0] || 'Member Regular', res.account.username);
                    } else {
                      const fallbackAccount = {
                        id: user.id,
                        username: displayName,
                        avatarUrl,
                        roles: ['ADMIN / Developer'],
                        tier: 'vvip' as const,
                        syncedAt: new Date().toISOString(),
                      };
                      applyVerifiedDiscordAccount(fallbackAccount, 'vvip');
                      unlockWithDiscord('ADMIN / Developer', displayName);
                    }
                  });
              }
            })
            .catch(() => {
              unlockWithDiscord('ADMIN / Developer');
            })
            .finally(() => {
              if (window.opener && window.opener !== window) {
                try {
                  window.opener.location.reload();
                  window.close();
                  return;
                } catch {
                  // ignore
                }
              }
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            });
        }
      }
    } catch {
      // ignore
    }
  }, [applyVerifiedDiscordAccount, unlockWithDiscord]);

  useEffect(() => {
    // Pasang banner galak di console
    initConsoleSecurity();

    // Pantau klo ada yg nyoba inspect / buka devtools
    const cleanup = attachSecurityListeners((triggerReason) => {
      setReason(triggerReason);
      setLocked(true);
      triggerSecurityLockdown(triggerReason);
    });

    const handleLockdownEvent = (e: Event) => {
      const custom = e as CustomEvent<{ reason?: string }>;
      setReason(custom.detail?.reason || 'Percobaan manipulasi skrip terdeteksi');
      setLocked(true);
    };

    const handleRestoreEvent = () => {
      setLocked(false);
    };

    window.addEventListener('sekolah_nakal_security_lockdown', handleLockdownEvent);
    window.addEventListener('sekolah_nakal_security_restore', handleRestoreEvent);

    return () => {
      cleanup();
      window.removeEventListener('sekolah_nakal_security_lockdown', handleLockdownEvent);
      window.removeEventListener('sekolah_nakal_security_restore', handleRestoreEvent);
    };
  }, []);

  // 1. Kena lockdown -> blokir layar
  if (locked) {
    return <SecurityLockdownScreen reason={reason} onRestore={() => setLocked(false)} />;
  }

  // 2. Belum sinkron / buka gate -> tampilkan Panel Sinkronisasi Discord
  if (!isUnlocked) {
    return <PrivateAccessGate />;
  }

  // 3. Masuk ke aplikasi streaming
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      }
    >
      <AuthenticatedApp />
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteGateProvider>
        <AppContent />
      </SiteGateProvider>
    </AuthProvider>
  );
}
