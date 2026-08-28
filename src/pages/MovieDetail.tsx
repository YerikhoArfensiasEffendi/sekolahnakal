import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { MovieDetail as MovieDetailType } from '@/types/movie';
import { movieService } from '@/services/movie.service';
import { watchPath } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { MovieMeta } from '@/components/movie/MovieMeta';
import { MovieRow } from '@/components/movie/MovieRow';
import { Section } from '@/components/ui/Section';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useWatchlist } from '@/hooks/useWatchlist';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetailType | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const loadMovie = async () => {
    if (!id) return;
    setStatus('loading');
    try {
      const data = await movieService.getById(id);
      setMovie(data);
      setStatus('success');
      document.title = `${data.title} — Sekolah Nakal`;
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadMovie();
    window.scrollTo(0, 0);
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="pt-16">
        <Skeleton className="h-[50vh] w-full rounded-none" />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
          <Skeleton variant="text" className="h-8 w-1/3" />
          <Skeleton variant="text" className="h-4 w-2/3" />
          <Skeleton variant="text" className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !movie) {
    return (
      <div className="pt-24">
        <ErrorState message="Film tidak ditemukan" onRetry={loadMovie} />
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);

  return (
    <div>
      {/* Backdrop */}
      <div className="relative h-[50vh] w-full overflow-hidden md:h-[65vh]">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto -mt-36 max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          {/* Poster */}
          <div className="hidden md:block">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full rounded-2xl shadow-2xl border border-border/60"
              width={300}
              height={450}
            />
          </div>

          {/* Info Details */}
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-text-primary md:text-5xl tracking-tight">
              {movie.title}
            </h1>

            <MovieMeta
              year={movie.year}
              duration={movie.duration}
              rating={movie.rating}
              genres={movie.genres}
              maturityRating={movie.maturityRating}
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={watchPath(movie.id)}>
                <Button size="lg" className="px-8 font-bold shadow-lg shadow-brand/20">
                  ▶ Putar Film
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => toggleWatchlist(movie)}
              >
                {inWatchlist ? '✓ Di Daftar Tontonan' : '+ Tambah ke Watchlist'}
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Sinopsis</h2>
              <p className="leading-relaxed text-text-secondary/95 text-base sm:text-lg">
                {movie.overview}
              </p>
            </div>

            <div className="grid gap-4 rounded-xl bg-bg-surface/60 border border-border/50 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-text-muted block text-xs uppercase font-medium">Sutradara</span>
                <span className="text-text-primary font-medium">{movie.director}</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs uppercase font-medium">Bahasa</span>
                <span className="text-text-primary font-medium">{movie.language}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-text-muted block text-xs uppercase font-medium">Pemeran</span>
                <span className="text-text-primary font-medium">{movie.cast.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies Row */}
        {movie.similarMovies.length > 0 && (
          <div className="mt-14 border-t border-border/50 pt-8">
            <Section title="Film Serupa yang Mungkin Anda Suka">
              <MovieRow movies={movie.similarMovies} />
            </Section>
          </div>
        )}
      </motion.div>
    </div>
  );
}
