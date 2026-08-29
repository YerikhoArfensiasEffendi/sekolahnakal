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
    <section className={`rounded-xl border border-white/10 bg-[#0c0a12] p-5 sm:p-6 shadow-xl ${className}`}>
      {showTitle && (
        <div className="pb-3 mb-4 border-b border-white/10">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar pembelian akses member VIP, VVIP, dan Talent terbaru.
          </p>
        </div>
      )}

      {/* Grid of Sharp Tegas Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {displayList.map((item) => {
          const lowerTier = item.purchasedAccess.toLowerCase();
          const isVvip = lowerTier.includes('vvip');
          const isTalent = lowerTier.includes('telent') || lowerTier.includes('talent');

          return (
            <div
              key={item.id || item.orderId}
              className="p-3.5 rounded-lg bg-[#110e1a] hover:bg-[#171324] border border-white/10 hover:border-white/20 transition-colors shadow-sm flex flex-col justify-between space-y-2.5"
            >
              {/* Header: Member Avatar & Username */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-md overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center shadow-inner">
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

                <span className="h-4.5 w-4.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <IconCheck className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Tier Access Badge & Price */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    isVvip
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : isTalent
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {isVvip ? <IconCrown className="w-2.5 h-2.5" /> : isTalent ? <IconDiamond className="w-2.5 h-2.5" /> : <IconStar className="w-2.5 h-2.5" />}
                  <span>{item.purchasedAccess}</span>
                </span>

                <span className="text-xs font-bold font-mono text-emerald-400">
                  {item.price}
                </span>
              </div>

              {/* Timestamp footer */}
              <div className="text-[9px] text-zinc-500 font-mono text-right pt-0.5">
                {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : item.createdAt}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
