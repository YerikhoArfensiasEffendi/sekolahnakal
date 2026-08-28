/**
 * Full-width Edge-to-Edge Hero Banner Carousel (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menampilkan Banner Grafis secara full-width kanan-kiri (object-cover edge-to-edge)
 * - Carousel multi-banner: Siap diisi dengan banner-banner promo tambahan kapan saja
 * - Autoplay halus + Navigasi panah & indikator titik
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie } from '@/types/movie';
import { DISCORD_BOT_INVITE_URL } from '@/utils/tier';

export interface BannerItem {
  id: string;
  image: string;
  link?: string;
  title?: string;
}

// Daftar Banner Slider Utama (Bisa ditambah banner baru kapan saja)
export const BANNER_SLIDES: BannerItem[] = [
  {
    id: 'official-banner-1',
    image: '/images/banner_promo.png',
    link: DISCORD_BOT_INVITE_URL,
    title: 'Sekolah Nakal Official',
  },
];

interface MovieHeroProps {
  movies?: Movie[];
  movie?: Movie;
  banners?: BannerItem[];
}

export function MovieHero({ banners = BANNER_SLIDES }: MovieHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideList = banners.length > 0 ? banners : BANNER_SLIDES;

  const nextSlide = useCallback(() => {
    if (slideList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  }, [slideList.length]);

  const prevSlide = useCallback(() => {
    if (slideList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length);
  }, [slideList.length]);

  // Autoplay carousel every 5.5 seconds jika banner > 1
  useEffect(() => {
    if (slideList.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [slideList.length, nextSlide]);

  const currentBanner = slideList[currentIndex] ?? slideList[0]!;

  return (
    <section className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[430px] pt-16 overflow-hidden select-none bg-black border-b border-border/30">
      {/* Background Slides Edge-to-Edge with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full"
        >
          <a
            href={currentBanner.link || DISCORD_BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full w-full relative group cursor-pointer"
            aria-label={currentBanner.title || 'Sekolah Nakal'}
          >
            <img
              src={currentBanner.image}
              alt={currentBanner.title || 'Sekolah Nakal'}
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              fetchPriority="high"
            />

            {/* Cinematic Vignette Overlays (Soft bottom & side vignette) */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
          </a>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Arrows (Muncul jika ada lebih dari 1 banner) */}
      {slideList.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all cursor-pointer border border-white/10 shadow-lg"
            aria-label="Slide sebelumnya"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all cursor-pointer border border-white/10 shadow-lg"
            aria-label="Slide berikutnya"
          >
            ›
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5">
            {slideList.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-brand'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Pindah ke banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
