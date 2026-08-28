import { useRef } from 'react';
import type { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import type { WatchProgress } from '@/types/movie';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';

interface MovieRowProps {
  movies: Movie[];
  variant?: 'default' | 'progress';
  progressMap?: Record<string, WatchProgress>;
}

/**
 * Horizontal scrollable row of movie cards.
 * Reusable for all home page sections with sleek aligned navigation buttons.
 */
export function MovieRow({ movies, variant = 'default', progressMap }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (movies.length === 0) return null;

  return (
    <div className="group/row relative">
      {/* Scroll button Left (Aligned with Thumbnail Center & Modern Glassmorphic Look) */}
      <button
        onClick={() => scroll('left')}
        className="absolute top-[36%] left-0 -translate-y-1/2 z-30 hidden h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white shadow-2xl border border-white/25 backdrop-blur-md transition-all group-hover/row:flex hover:scale-110 active:scale-95 cursor-pointer -ml-2 sm:-ml-3"
        aria-label="Scroll left"
      >
        <IconChevronLeft className="w-5 h-5" />
      </button>

      {/* Scroll button Right (Aligned with Thumbnail Center & Modern Glassmorphic Look) */}
      <button
        onClick={() => scroll('right')}
        className="absolute top-[36%] right-0 -translate-y-1/2 z-30 hidden h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white shadow-2xl border border-white/25 backdrop-blur-md transition-all group-hover/row:flex hover:scale-110 active:scale-95 cursor-pointer -mr-2 sm:-mr-3"
        aria-label="Scroll right"
      >
        <IconChevronRight className="w-5 h-5" />
      </button>

      {/* Scrollable container with generous vertical headroom for hover effects */}
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto py-6 -my-3 px-4 sm:px-6 lg:px-8 scrollbar-none"
        role="list"
      >
        {movies.map((movie) => {
          const progress = progressMap?.[movie.id];
          return (
            <div
              key={movie.id}
              className="w-56 shrink-0 sm:w-64 md:w-72 p-1.5"
              role="listitem"
            >
              <MovieCard
                movie={movie}
                variant={variant}
                progress={
                  progress ? progress.currentTime / progress.duration : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
