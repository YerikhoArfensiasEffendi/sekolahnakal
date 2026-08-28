/**
 * Layar Lockdown Keamanan
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Tampil klo ada aktivitas mencurigakan (F12, inspect, console injection).
 * Dibuat mandiri (zero-dependency) biar ga ada bug/crash pas kondisi darurat.
 */

import { useState } from 'react';
import { restoreSecuritySession, isDevToolsOpen } from '@/lib/antiTamper';

interface SecurityLockdownScreenProps {
  reason?: string;
  onRestore?: () => void;
}

// Ambil ID device dari local storage, klo gaada bikin fallback simpel
function getStoredDeviceId(): string {
  try {
    return localStorage.getItem('sekolah_nakal_device_id') || 'DEV-155053';
  } catch {
    return 'DEV-155053';
  }
}

export function SecurityLockdownScreen({
  reason = 'Percobaan manipulasi kode / injecting script / DevTools terdeteksi',
  onRestore,
}: SecurityLockdownScreenProps) {
  const [deviceId] = useState(() => getStoredDeviceId());
  const [isRestoring, setIsRestoring] = useState(false);
  const [warningError, setWarningError] = useState<string | null>(null);

  // Balikin sesi ke normal (wajib tutup DevTools terlebih dahulu)
  const handleRestore = () => {
    setIsRestoring(true);
    setWarningError(null);

    setTimeout(() => {
      if (isDevToolsOpen()) {
        setIsRestoring(false);
        setWarningError('⚠️ Harap TUTUP jendela Inspect / Developer Tools terlebih dahulu sebelum memulihkan sesi!');
        return;
      }

      const ok = restoreSecuritySession();
      if (ok) {
        if (onRestore) onRestore();
        window.location.href = '/';
      } else {
        setIsRestoring(false);
        setWarningError('⚠️ Harap TUTUP jendela Inspect / Developer Tools terlebih dahulu!');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black px-6 py-12 select-none overflow-y-auto">
      {/* Efek ambient glow merah tipis */}
      <div className="absolute h-96 w-96 rounded-full bg-red-600/10 blur-[160px] pointer-events-none" />

      {/* Konten teks peringatan bersih tanpa kotak kaku */}
      <div className="relative w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo Sekolah Nakal */}
        <div className="flex justify-center">
          <img
            src="/images/logo.png"
            alt="Sekolah Nakal"
            className="h-16 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Header Peringatan Tegas */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-red-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Security Watchdog Alert</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Percobaan Injeksi Skrip & DevTools Terdeteksi!
          </h1>

          <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
            Sistem mendeteksi aktivitas mencurigakan pada konsol pengembang atau percobaan eksekusi skrip eksternal. Akses streaming sementara dinonaktifkan untuk melindungi hak cipta video privat.
          </p>
        </div>

        {/* Info Forensik Sederhana */}
        <div className="space-y-1.5 text-xs font-mono text-text-muted/90 pt-1">
          <p>
            Pemicu: <span className="text-red-400 font-semibold">{reason}</span>
          </p>
          <p>
            Identitas Perangkat: <span className="text-white font-semibold">{deviceId}</span>
          </p>
          <p>
            Status Proteksi: <span className="text-yellow-400 font-semibold">ISOLATED_SESSION</span>
          </p>
        </div>

        {/* Warning Error jika DevTools masih terbuka */}
        {warningError && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold animate-shake text-center">
            {warningError}
          </div>
        )}

        {/* Tombol Pulihkan Sesi */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-sm rounded-lg shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRestoring ? 'Memeriksa Keamanan...' : 'Saya Mengerti & Pulihkan Sesi'}
          </button>
          <p className="text-[11px] text-text-muted/60">
            Dilarang membagikan atau memanipulasi kode privat Sekolah Nakal.
          </p>
        </div>
      </div>
    </div>
  );
}
