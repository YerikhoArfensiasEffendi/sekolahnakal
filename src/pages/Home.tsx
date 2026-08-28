/**
 * Halaman Utama (Beranda) Streaming Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Memuat data dari movieStore dengan Reguler Tier di posisi teratas
 * dan sayap banner iklan yang menyatu alami ke halaman.
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
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { IconUser } from '@/components/icons';

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

  const loadData = async () => {
    try {
      const all = movieStore.getAll();
      const [continueProgress] = await Promise.all([
        streamingService.getContinueWatching(),
      ]);

      const progressMap: Record<string, WatchProgress> = {};
      (continueProgress || []).forEach((p) => {
        if (p?.movieId) {
          progressMap[p.movieId] = p;
        }
      });

      // Match continue watching movies
      const continueWatchingMovies = (continueProgress || [])
        .map((p) => all.find((m) => m?.id === p?.movieId))
        .filter((m): m is Movie => m !== undefined);

      const defaultFeaturedMovie: Movie = {
        id: 'default-hero',
        title: 'Sekolah Nakal Streaming',
        slug: 'sekolah-nakal',
        genres: ['Eksklusif'],
        rating: 9.5,
        year: new Date().getFullYear(),
        duration: 120,
        tier: 'regular',
        overview: 'Platform streaming video dewasa privat & eksklusif Sekolah Nakal.',
        posterUrl: '/images/logo.png',
        backdropUrl: '/images/logo.png',
      };

      // 1. Trending: Diurutkan murni berdasarkan traffic / views terbanyak ke paling sedikit
      const trending = [...all].sort((a, b) => {
        const viewsA = (parseInt(localStorage.getItem(`sn_views_${a.id}`) || '0', 10) || (a.views || 0));
        const viewsB = (parseInt(localStorage.getItem(`sn_views_${b.id}`) || '0', 10) || (b.views || 0));
        if (viewsB !== viewsA) return viewsB - viewsA;
        return (b.rating || 0) - (a.rating || 0);
      });

      // 2. Random Feed: Full random acak setiap dimuat
      const randomFeed = [...all].sort(() => Math.random() - 0.5);

      // 3. Featured Hero Slides: Acak dari koleksi video
      const featuredSlides = randomFeed.length > 0 ? randomFeed.slice(0, 5) : [defaultFeaturedMovie];
      const featured = featuredSlides[0] || defaultFeaturedMovie;

      // 4. Rilis Terbaru: Diurutkan dari yang paling baru
      const newReleases = [...all].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

      // 5. Terpopuler
      const popular = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setData({
        featured,
        featuredSlides,
        trending,
        randomFeed,
        newReleases,
        popular,
        continueWatching: continueWatchingMovies,
        progressMap,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sekolah_nakal_movies_updated', loadData);
    window.addEventListener('sekolah_nakal_watch_progress_updated', loadData);
    return () => {
      window.removeEventListener('sekolah_nakal_movies_updated', loadData);
      window.removeEventListener('sekolah_nakal_watch_progress_updated', loadData);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div>
        <HeroSkeleton />
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
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
    <div className="relative min-h-screen pb-16">
      {/* Hero Banner Carousel Slider (Random Highlights) */}
      <MovieHero movies={data.featuredSlides.length > 0 ? data.featuredSlides : [data.featured]} />

      {/* Area Konten Utama & Sayap Iklan yang Menyatu Alami */}
      <div className="relative mx-auto max-w-[1720px] px-2 sm:px-4 flex justify-center items-start gap-4 lg:gap-6 -mt-8 z-10">
        {/* Sayap Iklan Kiri */}
        <SideAdSlot position="left" />

        {/* Baris Katalog Film Utama */}
        <div className="flex-1 max-w-7xl min-w-0 space-y-8">
          {/* Lanjutkan Menonton (Jika Ada History) */}
          {data.continueWatching.length > 0 && (
            <Section title="Lanjutkan Menonton" href="/history">
              <MovieRow movies={data.continueWatching} progressMap={data.progressMap} />
            </Section>
          )}

          {/* 1. SEDANG TREN SEKARANG (Diurutkan dari Traffic / Views Terbanyak) */}
          {data.trending.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <span>🔥</span>
                  <span>Sedang Tren Sekarang (Traffic Tertinggi)</span>
                </span>
              }
              href="/private-server"
            >
              <MovieRow movies={data.trending} />
            </Section>
          )}

          {/* 2. REKOMENDASI ACAK (Full Random Discovery Feed) */}
          {data.randomFeed.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <IconUser className="w-5 h-5 text-slate-400" />
                  <span>Rekomendasi Video (Acak)</span>
                </span>
              }
              href="/private-server"
            >
              <MovieRow movies={data.randomFeed} />
            </Section>
          )}

          {/* 3. RILIS TERBARU */}
          {data.newReleases.length > 0 && (
            <Section title="✨ Rilis Terbaru" href="/private-server">
              <MovieRow movies={data.newReleases} />
            </Section>
          )}

          {/* 4. PALING BANYAK DISUKAI */}
          {data.popular.length > 0 && (
            <Section title="⭐ Paling Banyak Disukai" href="/private-server">
              <MovieRow movies={data.popular} />
            </Section>
          )}

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

        {/* Sayap Iklan Kanan */}
        <SideAdSlot position="right" />
      </div>
    </div>
  );
}
