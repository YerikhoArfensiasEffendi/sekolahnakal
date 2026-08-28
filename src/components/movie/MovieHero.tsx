import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie } from '@/types/movie';
import { watchPath } from '@/constants/routes';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MovieHeroProps {
  movies?: Movie[];
  movie?: Movie;
}

export function MovieHero({ movies, movie }: MovieHeroProps) {
  const slideList: Movie[] = movies && movies.length > 0 ? movies : movie ? [movie] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (slideList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  }, [slideList.length]);

  const prevSlide = useCallback(() => {
    if (slideList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length);
  }, [slideList.length]);

  // Autoplay carousel every 5.5 seconds
  useEffect(() => {
    if (slideList.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [slideList.length, nextSlide]);

  if (slideList.length === 0) return null;

  const currentMovie = slideList[currentIndex] ?? slideList[0]!;

  return (
    <section className="relative w-full h-[300px] sm:h-[340px] md:h-[380px] pt-16 overflow-hidden select-none bg-black border-b border-border/30">
      {/* Background Slides Edge-to-Edge with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full"
        >
          {currentMovie.backdropUrl &&
          currentMovie.backdropUrl !== '/images/logo.png' &&
          !currentMovie.backdropUrl.includes('logo.png') ? (
            <img
              src={currentMovie.backdropUrl}
              alt={currentMovie.title}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-red-950/80 via-zinc-950 to-[#0a0a0d] relative flex items-center justify-center">
              <div className="absolute -top-20 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
              <div className="text-[72px] sm:text-[110px] font-black tracking-tighter text-white/[0.03] uppercase select-none pointer-events-none">
                SEKOLAH NAKAL
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Vignette Overlays (Soft bottom & side vignette) */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />

      {/* Slide Navigation Arrows */}
      {slideList.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all"
            aria-label="Slide sebelumnya"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-brand hover:scale-105 transition-all"
            aria-label="Slide berikutnya"
          >
            ›
          </button>
        </>
      )}

      {/* Hero Content: Centered at Bottom */}
      <div className="relative z-10 flex h-full items-end justify-center pb-6 sm:pb-8 text-center">
        <div className="mx-auto w-full max-w-3xl px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center space-y-2.5"
            >
              {/* Judul (Font diperkecil & proporsional) */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                {currentMovie.title}
              </h1>

              {/* Bawahnya Kategori / Genre */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {(currentMovie?.genres || []).map((genre) => (
                  <Badge
                    key={genre}
                    variant="brand"
                    className="bg-black/70 backdrop-blur-md border border-brand/40 px-2.5 py-0.5 text-[11px] font-semibold text-brand tracking-wide"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              {/* Direct CTA: Putar Video */}
              <div className="pt-1">
                {currentMovie?.id && (
                  <Link to={watchPath(currentMovie.id)}>
                    <Button size="sm" className="px-6 py-2 font-bold shadow-lg shadow-brand/30 hover:scale-105 transition-all text-xs sm:text-sm">
                      ▶ Putar Video
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Slide Indicators / Dots */}
          {(slideList || []).length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {(slideList || []).map((s, idx) => (
                <button
                  key={s?.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? 'w-6 bg-brand'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Pindah ke slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
