import { Link } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWatchlist } from '@/hooks/useWatchlist';
import { watchPath, movieDetailPath } from '@/constants/routes';
import { formatDuration } from '@/utils/format';

interface MoviePreviewModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MoviePreviewModal({ movie, isOpen, onClose }: MoviePreviewModalProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl" className="p-0 overflow-hidden">
      {/* Backdrop with Hero Content */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-bg-surface">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/40 to-transparent" />
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(movie?.genres || []).map((g) => (
                <Badge key={g} variant="brand">
                  {g}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
              {movie.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to={watchPath(movie.id)} onClick={onClose} className="flex-1 sm:flex-none">
            <Button size="md" className="w-full sm:w-auto px-6">
              ▶ Putar Sekarang
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="md"
            onClick={() => toggleWatchlist(movie)}
            className="flex items-center gap-2"
          >
            {inWatchlist ? '✓ Di Daftar' : '+ Tambah Daftar'}
          </Button>
          <Link to={movieDetailPath(movie.id)} onClick={onClose}>
            <Button variant="ghost" size="md">
              Halaman Detail →
            </Button>
          </Link>
        </div>

        {/* Metadata Cluster */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span className="font-semibold text-emerald-400">⭐ {movie.rating.toFixed(1)} / 10</span>
          <span>•</span>
          <span>{movie.year}</span>
          <span>•</span>
          <span>{formatDuration(movie.duration)}</span>
        </div>

        {/* Overview */}
        <p className="text-sm leading-relaxed text-text-secondary/90 sm:text-base">
          {movie.overview}
        </p>
      </div>
    </Modal>
  );
}
