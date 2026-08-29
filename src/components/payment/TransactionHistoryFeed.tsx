/**
 * Live Discord Transaction History Feed Component (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Desain:
 * - Minimalis, Clean, Tegas & Profesional (Tanpa Tag/Emoji Berlebihan)
 */

import { useState, useEffect } from 'react';
import { discordRealtimeService, type DiscordPaymentRecord } from '@/services/discordRealtime.service';
import { IconCheck, IconCrown, IconDiamond, IconStar, IconDiscord } from '@/components/icons';

interface TransactionHistoryFeedProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function TransactionHistoryFeed({ limit = 12, showTitle = true, className = '' }: TransactionHistoryFeedProps) {
  const [payments, setPayments] = useState<DiscordPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPayments = async () => {
      try {
        const res = await discordRealtimeService.getPayments(false);
        if (isMounted && res.success && Array.isArray(res.payments)) {
          setPayments(res.payments);
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPayments();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading && payments.length === 0) {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#0d0b14] p-5 sm:p-6 animate-pulse ${className}`}>
        <div className="h-5 w-44 bg-zinc-800 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900/90 rounded-lg border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) return null;

  const displayList = limit ? payments.slice(0, limit) : payments;

  return (
    <section className={`rounded-xl border border-white/10 bg-[#0c0a12] p-3.5 sm:p-5 shadow-xl ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Riwayat Transaksi</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Pembelian akses member VIP, VVIP, dan Talent terbaru.
            </p>
          </div>
          <div className="sm:hidden text-[10px] font-medium text-zinc-500">
            Geser ›
          </div>
        </div>
      )}

      {/* Responsive Layout: Horizontal Swipe on Mobile (< sm), Grid on Tablet/Desktop (>= sm) */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-1 sm:pb-0 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
        {displayList.map((item) => {
          const lowerTier = item.purchasedAccess.toLowerCase();
          const isVvip = lowerTier.includes('vvip');
          const isTalent = lowerTier.includes('telent') || lowerTier.includes('talent');

          return (
            <div
              key={item.id || item.orderId}
              className="min-w-[240px] max-w-[260px] sm:min-w-0 sm:max-w-none shrink-0 snap-start p-3 rounded-lg bg-[#110e1a] hover:bg-[#171324] border border-white/10 hover:border-white/20 transition-colors shadow-sm flex flex-col justify-between space-y-2"
            >
              {/* Header: Member Avatar & Username */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center shadow-inner">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.username} className="h-full w-full object-cover" />
                    ) : (
                      <IconDiscord className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      @{item.username}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-500 truncate">
                      {item.orderId}
                    </p>
                  </div>
                </div>

                <span className="h-4 w-4 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <IconCheck className="w-2 h-2" />
                </span>
              </div>

              {/* Tier Access Badge & Price */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    isVvip
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : isTalent
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {isVvip ? <IconCrown className="w-2.5 h-2.5" /> : isTalent ? <IconDiamond className="w-2.5 h-2.5" /> : <IconStar className="w-2.5 h-2.5" />}
                  <span className="truncate max-w-[90px]">{item.purchasedAccess}</span>
                </span>

                <span className="text-xs font-bold font-mono text-emerald-400">
                  {item.price}
                </span>
              </div>

              {/* Timestamp footer */}
              <div className="text-[9px] text-zinc-500 font-mono text-right">
                {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : item.createdAt}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
