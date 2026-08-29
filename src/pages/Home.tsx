/**
 * Halaman Utama (Beranda) Streaming Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Full-Width Edge-to-Edge Layout (Mepet Kanan-Kiri Bebas Sayap Iklan)
 * - Hero Banner Slider Terintegrasi Iklan (Otomatis naik ke atas saat di-hide)
 * - Live Bukti Transaksi Pembelian Member Discord dari Channel #purchase-history
 * - Row Katalog Responsif Modern
 */

import { useEffect, useState } from 'react';
import type { Movie, WatchProgress } from '@/types/movie';
import { movieStore } from '@/services/movieStore.service';
import { streamingService } from '@/services/streaming.service';
import { MovieHero } from '@/components/movie/MovieHero';
import { MovieRow } from '@/components/movie/MovieRow';
import { Section } from '@/components/ui/Section';
import { MovieRowSkeleton, HeroSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { adStoreService, type AdSlotConfig } from '@/services/adStore.service';
import { TransactionHistoryFeed } from '@/components/payment/TransactionHistoryFeed';

interface HomeData {
  featured: Movie;
  featuredSlides: Movie[];
  trending: Movie[];
  randomFeed: Movie[];
  newReleases: Movie[];
  popular: Movie[];
  continueWatching: Movie[];
  progressMap: Record<string, WatchProgress>;
}

type Status = 'loading' | 'success' | 'error';

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [adConfig, setAdConfig] = useState(() => adStoreService.getConfig());

  const heroSlot = adConfig.slots.find((s: AdSlotConfig) => s.id === 'hero-top');
  const isHeroAdActive = Boolean(adConfig.masterEnabled && heroSlot?.enabled);

  const loadData = async () => {
    try {
      const all = await movieStore.refreshFromServer();
      const [continueProgress] = await Promise.all([
        streamingService.getContinueWatching(),
      ]);

      const progressMap: Record<string, WatchProgress> = {};
      (continueProgress || []).forEach((p) => {
        if (p?.movieId) {
          progressMap[p.movieId] = p;
        }
      });

      // 1. Film Unggulan (Hero Banner)
      const featured = all.length > 0 ? all[0]! : ({} as Movie);
      const featuredSlides = all.slice(0, 5);

      // 2. Sedang Tren (Urutan traffic / views terbanyak)
      const trending = [...all].sort((a, b) => {
        const viewsA = (parseInt(localStorage.getItem(`sn_views_${a.id}`) || '0', 10) || (a.views || 0));
        const viewsB = (parseInt(localStorage.getItem(`sn_views_${b.id}`) || '0', 10) || (b.views || 0));
        if (viewsB !== viewsA) return viewsB - viewsA;
        return (b.rating || 0) - (a.rating || 0);
      });

      // 3. Rekomendasi Acak (Full Random Discovery)
      const randomFeed = [...all].sort(() => Math.random() - 0.5);

      // 4. Rilis Terbaru (Berdasarkan tahun/input)
      const newReleases = [...all].sort((a, b) => b.year - a.year);

      // 5. Paling Banyak Disukai (Rating & Likes tertinggi)
      const popular = [...all].sort((a, b) => {
        const likesA = parseInt(localStorage.getItem(`sn_likes_${a.id}`) || '0', 10);
        const likesB = parseInt(localStorage.getItem(`sn_likes_${b.id}`) || '0', 10);
        if (likesB !== likesA) return likesB - likesA;
        return (b.rating || 0) - (a.rating || 0);
      });

      // 6. Lanjutkan Menonton
      const continueWatching = (continueProgress || [])
        .map((p) => all.find((m) => m.id === p.movieId))
        .filter((m): m is Movie => m !== undefined);

      setData({
        featured,
        featuredSlides,
        trending,
        randomFeed,
        newReleases,
        popular,
        continueWatching,
        progressMap,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
    const handleAds = () => {
      setAdConfig(adStoreService.getConfig());
    };
    window.addEventListener('sekolah_nakal_movies_updated', loadData);
    window.addEventListener('sekolah_nakal_watch_progress_updated', loadData);
    window.addEventListener('sekolah_nakal_ads_updated', handleAds);
    return () => {
      window.removeEventListener('sekolah_nakal_movies_updated', loadData);
      window.removeEventListener('sekolah_nakal_watch_progress_updated', loadData);
      window.removeEventListener('sekolah_nakal_ads_updated', handleAds);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className={isHeroAdActive ? '' : 'pt-20 sm:pt-24'}>
        {isHeroAdActive && <HeroSkeleton />}
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-6">
          <MovieRowSkeleton />
          <MovieRowSkeleton />
          <MovieRowSkeleton />
        </div>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <ErrorState
          message="Terjadi kendala saat menyinkronkan data katalog streaming."
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16 select-none">
      {/* Hero Banner Carousel Slider (Advertising Slot) */}
      <MovieHero movies={data.featuredSlides.length > 0 ? data.featuredSlides : [data.featured]} />

      {/* Full-Width Edge-to-Edge Content Container (Mepet Kanan Kiri) */}
      <div
        className={`w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 space-y-8 z-10 relative ${
          isHeroAdActive ? '-mt-8' : 'pt-20 sm:pt-24'
        }`}
      >
        {/* Lanjutkan Menonton (Jika Ada History) */}
        {data.continueWatching.length > 0 && (
          <Section title="Lanjutkan Menonton" href="/history">
            <MovieRow movies={data.continueWatching} progressMap={data.progressMap} />
          </Section>
        )}

        {/* 1. SEDANG TREN SEKARANG */}
        {data.trending.length > 0 && (
          <Section title="Sedang Tren Sekarang" href="/private-server">
            <MovieRow movies={data.trending} />
          </Section>
        )}

        {/* 2. REKOMENDASI ACAK */}
        {data.randomFeed.length > 0 && (
          <Section title="Rekomendasi Video" href="/private-server">
            <MovieRow movies={data.randomFeed} />
          </Section>
        )}

        {/* 3. RILIS TERBARU */}
        {data.newReleases.length > 0 && (
          <Section title="Rilis Terbaru" href="/private-server">
            <MovieRow movies={data.newReleases} />
          </Section>
        )}

        {/* 4. PALING BANYAK DISUKAI */}
        {data.popular.length > 0 && (
          <Section title="Paling Banyak Disukai" href="/private-server">
            <MovieRow movies={data.popular} />
          </Section>
        )}

        {/* 5. RIWAYAT TRANSAKSI */}
        <div className="pt-2">
          <TransactionHistoryFeed limit={12} />
        </div>

        {/* Empty State jika database kosong */}
        {data.trending.length === 0 && data.randomFeed.length === 0 && (
          <div className="py-20 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 space-y-3">
            <div className="text-4xl">🎬</div>
            <h3 className="text-lg font-bold text-white">Katalog Masih Kosong</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Belum ada video yang dipublikasikan. Silakan upload video pertama Anda melalui Studio Admin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
