/**
 * Panel Masuk & Sinkronisasi Discord (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 */

import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL } from '@/utils/tier';
import { getDiscordOAuthUrl, launchDiscordOAuth } from '@/utils/discordOAuth';
import { IconDiscord, IconTelegram } from '@/components/icons';

export function PrivateAccessGate() {
  const { syncDiscord } = useAuth();
  const { unlockAsGuest } = useSiteGate();

  const handleGuestEnter = () => {
    syncDiscord('Member Regular', 'Tamu_' + Math.floor(1000 + Math.random() * 9000));
    unlockAsGuest();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none bg-[#C9323B] overflow-hidden">
      {/* Full-Screen Subtle Blurry Red Logo Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center">
        <img
          src="/images/logo.png"
          alt="Sekolah Nakal Backdrop"
          className="w-full h-full object-cover object-center scale-105 blur-[6px] transform-gpu"
        />
        {/* Subtle Dark Vignette */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
      </div>

      {/* Ambient Accent Lights */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-[#5865F2]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />

      {/* Semi-Transparent Access Modal Card */}
      <div className="relative my-auto w-full max-w-md rounded-2xl bg-[#121318]/70 border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl text-text-primary animate-in fade-in zoom-in-95 text-center ring-1 ring-white/10">
        {/* Header Brand */}
        <div className="space-y-2 mb-7">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo.png"
              alt="Sekolah Nakal"
              className="h-16 w-auto object-contain drop-shadow-2xl"
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

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Main Discord OAuth Button */}
          <a
            href={getDiscordOAuthUrl()}
            onClick={(e) => {
              e.preventDefault();
              launchDiscordOAuth();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#5865F2]/25 transition-all cursor-pointer select-none"
          >
            <IconDiscord className="w-5 h-5" />
            <span>Masuk dengan Discord</span>
          </a>

          {/* Smaller Guest Mode Button */}
          <button
            type="button"
            onClick={handleGuestEnter}
            className="w-full py-2 px-3 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
          >
            Masuk sebagai Tamu
          </button>
        </div>

        {/* Community & Social Links */}
        <div className="mt-7 pt-5 border-t border-zinc-800/80">
          <p className="text-[11px] font-medium text-zinc-400 mb-3">
            Komunitas & Server Resmi
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* Discord Link */}
            <a
              href={DISCORD_BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#7289DA] hover:text-white transition-all text-xs font-semibold"
              title="Server Discord Resmi"
            >
              <IconDiscord className="w-4 h-4" />
              <span>Discord</span>
            </a>

            {/* Telegram Link */}
            <a
              href={TELEGRAM_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#229ED9] hover:text-white transition-all text-xs font-semibold"
              title="Channel Telegram Resmi"
            >
              <IconTelegram className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
