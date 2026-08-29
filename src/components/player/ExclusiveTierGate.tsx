import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { VideoTier } from '@/types/movie';
import { useAuth } from '@/contexts/AuthContext';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL } from '@/utils/tier';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
  IconDiscord,
  IconLock,
} from '@/components/icons';

interface ExclusiveTierGateProps {
  requiredTier: VideoTier;
  onUnlocked?: () => void;
}

export function ExclusiveTierGate({ requiredTier }: ExclusiveTierGateProps) {
  const navigate = useNavigate();
  const { discordAccount, hasAccessToTier } = useAuth();
  const tierConfig = getTierBadgeConfig(requiredTier);

  const isAccessGranted = hasAccessToTier(requiredTier);

  const handleRedirectDiscord = () => {
    window.open(DISCORD_BOT_INVITE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleGoToSync = () => {
    navigate('/settings?tab=discord');
  };

  const renderTierIcon = () => {
    switch (tierConfig.iconType) {
      case 'crown':
        return <IconCrown className="w-3.5 h-3.5 text-amber-400" />;
      case 'star':
        return <IconStar className="w-3.5 h-3.5 text-purple-400" />;
      case 'diamond':
        return <IconDiamond className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <IconUser className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="relative min-h-[380px] sm:min-h-[440px] md:aspect-video w-full flex flex-col items-center justify-center rounded-xl overflow-hidden bg-black/95 border border-border/80 p-5 sm:p-8 text-center select-none shadow-2xl">
      {/* Blurred Ambient Glow */}
      <div
        className="absolute inset-0 opacity-25 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${tierConfig.color}, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 flex flex-col items-center max-w-lg space-y-3 sm:space-y-4 my-auto"
      >
        {/* Logo Sekolah Nakal di Tengah (Responsive) */}
        <div className="relative">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-black/70 border border-white/20 p-2 shadow-2xl flex items-center justify-center backdrop-blur-md">
            <img
              src="/images/logo_v2.png"
              alt="Logo Sekolah Nakal"
              className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-black border border-white/30 text-amber-400 shadow">
            <IconLock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>

        {/* Tier Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${tierConfig.badgeClass}`}>
          {renderTierIcon()}
          <span className="font-bold text-[10px] sm:text-xs">AKSES {tierConfig.label} DIPERLUKAN</span>
        </div>

        {/* Main Conditional Message */}
        <div className="space-y-1">
          {!discordAccount ? (
            <>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Tier Terkunci
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md px-2">
                Silakan masuk dan sinkronkan akun Anda ke Discord untuk membuka konten video eksklusif ini.
              </p>
            </>
          ) : !isAccessGranted ? (
            <>
              <h2 className="text-lg sm:text-2xl font-black text-red-400 tracking-tight">
                Role Belum Dimiliki
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md px-2">
                Akun Discord Anda (<strong className="text-white">@{discordAccount.username}</strong>) belum memiliki role <strong className="text-amber-300">{tierConfig.label}</strong>. Silakan beli atau klaim role terlebih dahulu di server Discord resmi.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
                Akses Terverifikasi
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Role Discord Anda telah cocok. Memuat pemutar video...
              </p>
            </>
          )}
        </div>

        {/* Action Buttons (Full Width on Mobile) */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {!discordAccount ? (
            <>
              <button
                type="button"
                onClick={handleGoToSync}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconDiscord className="w-4 h-4" />
                <span>Sinkronkan Akun Discord</span>
              </button>

              <button
                type="button"
                onClick={handleRedirectDiscord}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-xs sm:text-sm font-semibold text-text-secondary hover:text-white border border-border transition-colors cursor-pointer"
              >
                Kunjungi Server Discord ↗
              </button>
            </>
          ) : !isAccessGranted ? (
            <>
              <button
                type="button"
                onClick={handleRedirectDiscord}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconDiscord className="w-4 h-4" />
                <span>Buka Discord & Beli Role {tierConfig.shortLabel}</span>
              </button>

              <button
                type="button"
                onClick={handleGoToSync}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-xs sm:text-sm font-semibold text-text-secondary hover:text-white border border-border transition-colors cursor-pointer"
              >
                Sinkron Ulang
              </button>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
