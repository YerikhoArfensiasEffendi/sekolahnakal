/**
 * Panel Masuk Gerbang Akses Streaming (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 */

import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL } from '@/utils/tier';
import { IconDiscord, IconTelegram } from '@/components/icons';

export function PrivateAccessGate() {
  const { syncDiscord } = useAuth();
  const { unlockAsGuest } = useSiteGate();

  const handleGuestEnter = () => {
    syncDiscord('Member Regular', 'Tamu_' + Math.floor(1000 + Math.random() * 9000));
    unlockAsGuest();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none bg-[#09090b] overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand/10 blur-[140px] pointer-events-none" />

      {/* Access Modal Card */}
      <div className="relative my-auto w-full max-w-md rounded-2xl bg-[#121215] border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-text-primary animate-in fade-in zoom-in-95 text-center">
        {/* Header Brand */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/images/logo_v2.png"
              alt="Sekolah Nakal"
              className="h-16 w-auto object-contain drop-shadow-xl"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Sekolah Nakal
          </h1>

          <p className="text-xs font-medium text-zinc-400">
            Platform Streaming Video Eksklusif & Komunitas Resmi
          </p>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="bg-red-600/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
              18+ ADULT ONLY
            </span>
          </div>
        </div>

        {/* Primary Action Button: Masuk sebagai Tamu */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGuestEnter}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand to-red-700 hover:from-red-600 hover:to-red-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-brand/25 transition-all cursor-pointer select-none flex items-center justify-center gap-2"
          >
            <span>Masuk sebagai Tamu</span>
            <span>→</span>
          </button>

          <p className="text-[10px] text-zinc-500 leading-relaxed px-2">
            💡 Untuk sinkronisasi role VIP/VVIP Discord, masuk sebagai tamu lalu hubungkan akun melalui menu <strong>Pengaturan</strong>.
          </p>
        </div>

        {/* Community & Contact Links (Discord, Tele, Sosmed) */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <p className="text-[11px] font-medium text-zinc-400 mb-3">
            Komunitas & Kontak Resmi
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Discord Link */}
            <a
              href={DISCORD_BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/5 hover:bg-[#5865F2]/20 border border-white/10 text-zinc-300 hover:text-white transition-all text-[11px] font-semibold"
              title="Server Discord Resmi"
            >
              <IconDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Discord</span>
            </a>

            {/* Telegram Link */}
            <a
              href={TELEGRAM_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/5 hover:bg-[#229ED9]/20 border border-white/10 text-zinc-300 hover:text-white transition-all text-[11px] font-semibold"
              title="Channel Telegram Resmi"
            >
              <IconTelegram className="w-3.5 h-3.5 text-[#229ED9]" />
              <span>Telegram</span>
            </a>

            {/* Sosmed Link */}
            <a
              href="https://t.me/sekolahnakal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 text-zinc-300 hover:text-white transition-all text-[11px] font-semibold"
              title="Media Sosial Resmi"
            >
              <span className="text-xs">🌐</span>
              <span>Sosmed</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
