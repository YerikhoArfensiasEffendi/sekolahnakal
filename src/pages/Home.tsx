/**
 * Halaman Utama (Beranda) Streaming Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Memuat data dari movieStore dengan Reguler Tier di posisi teratas
 * dan sayap banner iklan yang menyatu alami ke halaman.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Movie, WatchProgress } from '@/types/movie';
import { movieService } from '@/services/movie.service';
import { movieStore } from '@/services/movieStore.service';
import { streamingService } from '@/services/streaming.service';
import { MovieHero } from '@/components/movie/MovieHero';
import { MovieRow } from '@/components/movie/MovieRow';
import { Section } from '@/components/ui/Section';
import { MovieRowSkeleton, HeroSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { IconCrown, IconStar, IconDiamond, IconUser } from '@/components/icons';

interface HomeData {
  featured: Movie;
  featuredSlides: Movie[];
  trending: Movie[];
  popular: Movie[];
  newReleases: Movie[];
  regular: Movie[];
  vvip: Movie[];
  vip: Movie[];
  talent: Movie[];
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
      const [trending, popular, newReleases, continueProgress] = await Promise.all([
        movieService.getTrending(),
        movieService.getPopular(),
        movieService.getNewReleases(),
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

      const featured = all[0] || trending[0] || defaultFeaturedMovie;
      const featuredSlides = all.length > 0 ? all.slice(0, 5) : [defaultFeaturedMovie];

      const vvip = all.filter((m) => m.tier === 'vvip');
      const vip = all.filter((m) => m.tier === 'vip');
      const talent = all.filter((m) => m.tier === 'talent');
      const regular = all.filter((m) => !m.tier || m.tier === 'regular');

      setData({
        featured,
        featuredSlides,
        trending,
        popular,
        newReleases,
        regular,
        vvip,
        vip,
        talent,
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
      {/* Hero Banner Carousel Slider */}
      <MovieHero movies={data.featuredSlides.length > 0 ? data.featuredSlides : [data.featured]} />

      {/* Area Konten Utama & Sayap Iklan yang Menyatu Alami */}
      <div className="relative mx-auto max-w-[1720px] px-2 sm:px-4 flex justify-center items-start gap-4 lg:gap-6 -mt-8 z-10">
        {/* Sayap Iklan Kiri (Menyatu dalam alur scroll, tidak floating) */}
        <SideAdSlot position="left" />

        {/* Baris Katalog Film Utama */}
        <div className="flex-1 max-w-7xl min-w-0 space-y-8">
          {/* Continue Watching Section */}
          {data.continueWatching.length > 0 && (
            <Section title="Lanjutkan Menonton">
              <MovieRow movies={data.continueWatching} progressMap={data.progressMap} />
            </Section>
          )}

          {/* 1. REGULER STREAMING (Paling Atas Sesuai Permintaan) */}
          {data.regular.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <IconUser className="w-5 h-5 text-slate-400" />
                  <span>REGULER STREAMING</span>
                </span>
              }
            >
              <MovieRow movies={data.regular} />
            </Section>
          )}

          {/* Discord Role Integration Info Banner on Landing Page */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121215] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">👑</span>
                <h3 className="text-sm font-bold text-white">Punya Role VIP / VVIP di Discord?</h3>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Hubungkan akun Anda melalui menu <strong>Pengaturan</strong> untuk menyinkronkan role Discord dan membuka seluruh video eksklusif tanpa batas.
              </p>
            </div>
            <Link
              to="/settings?tab=discord"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              <span>Buka Pengaturan Akun</span>
              <span>→</span>
            </Link>
          </div>

          {/* 2. Exclusive VVIP Section */}
          {data.vvip.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <IconCrown className="w-5 h-5 text-amber-400" />
                  <span>EXCLUSIF VVIP STREAMING</span>
                </span>
              }
            >
              <MovieRow movies={data.vvip} />
            </Section>
          )}

          {/* 3. Exclusive VIP Section */}
          {data.vip.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <IconStar className="w-5 h-5 text-purple-400" />
                  <span>EXCLUSIF VIP STREAMING</span>
                </span>
              }
            >
              <MovieRow movies={data.vip} />
            </Section>
          )}

          {/* 4. Exclusive Talent Section */}
          {data.talent.length > 0 && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <IconDiamond className="w-5 h-5 text-cyan-400" />
                  <span>EXCLUSIF TALENT & CREATOR</span>
                </span>
              }
            >
              <MovieRow movies={data.talent} />
            </Section>
          )}

          {/* 5. Trending Now */}
          {data.trending.length > 0 && (
            <Section title="Sedang Tren Sekarang">
              <MovieRow movies={data.trending} />
            </Section>
          )}

          {/* 6. New Releases */}
          {data.newReleases.length > 0 && (
            <Section title="Rilis Terbaru">
              <MovieRow movies={data.newReleases} />
            </Section>
          )}

          {/* 7. Popular Movies */}
          {data.popular.length > 0 && (
            <Section title="Paling Banyak Ditonton">
              <MovieRow movies={data.popular} />
            </Section>
          )}

          {/* Empty State jika database kosong (Production Clean Slate) */}
          {data.regular.length === 0 &&
            data.vvip.length === 0 &&
            data.vip.length === 0 &&
            data.talent.length === 0 &&
            data.trending.length === 0 && (
              <div className="py-20 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 space-y-3">
                <div className="text-4xl">🎬</div>
                <h3 className="text-lg font-bold text-white">Katalog Masih Kosong</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Belum ada video yang dipublikasikan. Silakan upload video pertama Anda melalui Studio Admin.
                </p>
              </div>
            )}
        </div>

        {/* Sayap Iklan Kanan (Menyatu dalam alur scroll, tidak floating) */}
        <SideAdSlot position="right" />
      </div>
    </div>
  );
}
