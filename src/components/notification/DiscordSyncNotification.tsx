import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification, type AppNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  IconBell,
  IconDiscord,
  IconSparkles,
  IconCheck,
} from '@/components/icons';

export function DiscordSyncNotification() {
  const navigate = useNavigate();
  const { discordAccount } = useAuth();
  const {
    notifications,
    unreadCount,
    isSubscribed,
    activePopup,
    toggleSubscribe,
    markAsRead,
    clearNotification,
    clearAll,
    dismissActivePopup,
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    dismissActivePopup();

    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Bell Notification Action Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          dismissActivePopup();
        }}
        aria-label="Pemberitahuan & Notifikasi"
        title="Notifikasi & Update"
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
          isOpen
            ? 'bg-white/20 text-white border border-white/40'
            : 'bg-bg-surface text-text-secondary border border-border/70 hover:text-white hover:border-brand/60 hover:bg-bg-hover'
        }`}
      >
        <IconBell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Blurry Transparent Active Pop-up Banner (Shows Once or on New Upload) */}
      <AnimatePresence>
        {activePopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-11 z-50 w-72 sm:w-80 rounded-2xl border border-white/20 bg-black/80 p-3.5 shadow-2xl backdrop-blur-2xl text-white"
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-white shadow-lg ${
                  activePopup.type === 'discord_sync' ? 'bg-[#5865F2]' : 'bg-brand'
                }`}
              >
                {activePopup.type === 'discord_sync' ? (
                  <IconDiscord className="w-5 h-5" />
                ) : (
                  <IconSparkles className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#9ba5ff]">
                    {activePopup.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissActivePopup();
                    }}
                    className="text-text-muted hover:text-white text-xs p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs font-semibold text-white/95 leading-snug line-clamp-2">
                  {activePopup.message}
                </p>
                <span className="text-[10px] text-text-muted">{activePopup.timestamp}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNotificationClick(activePopup)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 active:scale-[0.98] text-xs font-bold text-white transition-all text-center cursor-pointer border border-white/20"
              >
                {activePopup.type === 'discord_sync' ? 'Sinkronkan Sekarang →' : 'Tonton Video →'}
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsRead(activePopup.id);
                  dismissActivePopup();
                }}
                className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-text-muted hover:text-white transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Click Dropdown Notification Hub (Blurry Transparent Glassmorphism) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-white/20 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl space-y-3.5 text-white"
          >
            {/* Header: Title & Actions */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <IconBell className="w-4 h-4 text-white" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Pusat Notifikasi
                </h4>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand/30 border border-brand/50 text-white px-2 py-0.2 text-[10px] font-bold">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] text-text-muted hover:text-white transition-colors"
                  >
                    Bersihkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-text-muted hover:text-white p-0.5"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Channel Subscription Toggle Box */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Langganan Upload Video</span>
                <span className="text-[10px] text-text-muted block">
                  Dapatkan notifikasi instan saat video baru diunggah.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSubscribe}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSubscribed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-brand hover:bg-brand-hover text-white shadow-md'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            </div>

            {/* Notification List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted space-y-1">
                  <IconBell className="w-6 h-6 mx-auto opacity-40 mb-1.5" />
                  <p>Tidak ada notifikasi baru.</p>
                  <p className="text-[10px] text-text-muted/70">
                    Semua pembaruan telah Anda baca.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative rounded-xl border p-3 transition-all cursor-pointer flex items-start gap-3 ${
                      notif.isRead
                        ? 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:bg-white/10'
                        : 'bg-white/15 border-white/25 hover:bg-white/20 shadow-lg'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-white ${
                        notif.type === 'discord_sync'
                          ? 'bg-[#5865F2]'
                          : notif.type === 'new_upload'
                          ? 'bg-brand'
                          : 'bg-bg-surface'
                      }`}
                    >
                      {notif.type === 'discord_sync' ? (
                        <IconDiscord className="w-4 h-4" />
                      ) : (
                        <IconSparkles className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white truncate">{notif.title}</h5>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-text-muted hover:text-white p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-text-muted block pt-0.5">
                        {notif.timestamp}
                      </span>
                    </div>

                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-brand shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Discord Link if unsynced */}
            {!discordAccount && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted">Ingin akses full video?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings?tab=discord');
                  }}
                  className="text-xs font-semibold text-[#9ba5ff] hover:underline"
                >
                  Sinkron Discord →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
