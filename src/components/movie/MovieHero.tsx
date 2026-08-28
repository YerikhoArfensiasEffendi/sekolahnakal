/**
 * Promotional & Community Hero Banner Carousel (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menampilkan Banner Promosi Resmi Sekolah Nakal (.gg/serverbokep & sekolahnakal.xyz)
 * - Slider multi-promosi (Discord Server, Telegram Official, Private Server VIP)
 * - Tombol aksi langsung ke komunitas & katalog eksklusif
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie } from '@/types/movie';
import { DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL } from '@/utils/tier';
import { IconDiscord, IconCrown, IconPlay } from '@/components/icons';

interface PromoSlide {
  id: string;
  type: 'image_banner' | 'vip_promo' | 'realtime_promo';
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  badge?: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  isExternalPrimary?: boolean;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
  isExternalSecondary?: boolean;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'official-banner',
    type: 'image_banner',
    imageSrc: '/images/banner_promo.png',
    primaryBtnText: '💬 Join Discord (.gg/serverbokep)',
    primaryBtnLink: DISCORD_BOT_INVITE_URL,
    isExternalPrimary: true,
    secondaryBtnText: '📱 Telegram Official',
    secondaryBtnLink: TELEGRAM_INVITE_URL,
    isExternalSecondary: true,
  },
  {
    id: 'vip-exclusive',
    type: 'vip_promo',
    title: '👑 Buka Akses VIP & VVIP Uncensored',
    subtitle: 'Nikmati ratusan video eksklusif tanpa sensor berkecepatan tinggi dengan menyinkronkan role Discord Anda.',
    badge: 'PRIVATE SERVER',
    primaryBtnText: '🚀 Buka Private Server',
    primaryBtnLink: '/private-server',
    isExternalPrimary: false,
    secondaryBtnText: '💬 Dapatkan Role VIP',
    secondaryBtnLink: DISCORD_BOT_INVITE_URL,
    isExternalSecondary: true,
  },
  {
    id: 'discord-realtime',
    type: 'realtime_promo',
    title: '⚡ Sinkronisasi Real-Time 24/7',
    subtitle: 'Semua konten video terbaru yang dikirim di Discord langsung tayang otomatis ke web & ZeroStorage CDN.',
    badge: 'LIVE AUTO-SYNC',
    primaryBtnText: '🔥 Jelajahi Koleksi Video',
    primaryBtnLink: '/search',
    isExternalPrimary: false,
    secondaryBtnText: '💬 Komunitas Discord',
    secondaryBtnLink: DISCORD_BOT_INVITE_URL,
    isExternalSecondary: true,
  },
];

interface MovieHeroProps {
  movies?: Movie[];
  movie?: Movie;
}

export function MovieHero(_props?: MovieHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  // Autoplay carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentSlide = PROMO_SLIDES[currentIndex] ?? PROMO_SLIDES[0]!;

  return (
    <section className="relative w-full pt-16 select-none bg-black border-b border-border/30 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 via-black to-[#09090b] shadow-2xl min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center justify-center">
          {/* Subtle Ambient Red Glow in Background */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

          {/* Slide Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all cursor-pointer border border-white/10 shadow-lg text-sm sm:text-base"
            aria-label="Slide sebelumnya"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all cursor-pointer border border-white/10 shadow-lg text-sm sm:text-base"
            aria-label="Slide berikutnya"
          >
            ›
          </button>

          {/* Slide Content with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8"
            >
              {currentSlide.type === 'image_banner' ? (
                /* Slide 1: Official Graphic Banner Artwork */
                <div className="w-full flex flex-col items-center justify-center text-center space-y-4 max-w-4xl">
                  <div className="relative max-h-[160px] sm:max-h-[200px] md:max-h-[220px] w-auto overflow-hidden rounded-xl">
                    <img
                      src={currentSlide.imageSrc}
                      alt="Sekolah Nakal Official Banner"
                      className="max-h-[160px] sm:max-h-[200px] md:max-h-[220px] w-auto object-contain drop-shadow-[0_4px_24px_rgba(37,99,235,0.25)] hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1">
                    <a
                      href={currentSlide.primaryBtnLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-[#5865F2]/25 hover:scale-105"
                    >
                      <IconDiscord className="w-4 h-4" />
                      <span>{currentSlide.primaryBtnText}</span>
                    </a>

                    {currentSlide.secondaryBtnLink && (
                      <a
                        href={currentSlide.secondaryBtnLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all hover:scale-105"
                      >
                        <span>{currentSlide.secondaryBtnText}</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : currentSlide.type === 'vip_promo' ? (
                /* Slide 2: VIP Community Promo */
                <div className="w-full flex flex-col items-center justify-center text-center space-y-3.5 max-w-2xl px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md">
                    <IconCrown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentSlide.badge}</span>
                  </span>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    {currentSlide.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-lg">
                    {currentSlide.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                    <Link
                      to={currentSlide.primaryBtnLink}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black px-5 py-2.5 text-xs sm:text-sm font-black transition-all shadow-lg hover:shadow-amber-500/25 hover:scale-105"
                    >
                      <IconCrown className="w-4 h-4" />
                      <span>{currentSlide.primaryBtnText}</span>
                    </Link>

                    {currentSlide.secondaryBtnLink && (
                      <a
                        href={currentSlide.secondaryBtnLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all shadow hover:scale-105"
                      >
                        <IconDiscord className="w-4 h-4" />
                        <span>{currentSlide.secondaryBtnText}</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Slide 3: Real-Time Discord Pipeline Promo */
                <div className="w-full flex flex-col items-center justify-center text-center space-y-3.5 max-w-2xl px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{currentSlide.badge}</span>
                  </span>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    {currentSlide.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-lg">
                    {currentSlide.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                    <Link
                      to={currentSlide.primaryBtnLink}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white px-5 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-brand/30 hover:scale-105"
                    >
                      <IconPlay className="w-4 h-4" />
                      <span>{currentSlide.primaryBtnText}</span>
                    </Link>

                    {currentSlide.secondaryBtnLink && (
                      <a
                        href={currentSlide.secondaryBtnLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all hover:scale-105"
                      >
                        <IconDiscord className="w-4 h-4" />
                        <span>{currentSlide.secondaryBtnText}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Carousel Slide Indicators / Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5">
            {PROMO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-brand'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Pindah ke promo slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
