import { Link } from 'react-router-dom';
import { useWatchlist } from '@/hooks/useWatchlist';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { MovieCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Watchlist() {
  const { watchlist, isLoading } = useWatchlist();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary">Daftar Tontonan Saya</h1>
          <p className="text-sm text-text-secondary mt-1">
            {watchlist.length} film tersimpan di daftar Anda
          </p>
        </div>
        <Link to="/browse">
          <Button variant="secondary" size="sm">
            + Jelajahi Film
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && watchlist.length === 0 && (
        <EmptyState
          message="Daftar tontonan Anda masih kosong. Simpan film favorit Anda untuk ditonton nanti!"
          icon="🎬"
          action={
            <Link to="/browse">
              <Button size="md">Jelajahi Katalog Film</Button>
            </Link>
          }
        />
      )}

      {!isLoading && watchlist.length > 0 && <MovieGrid movies={watchlist} />}
    </div>
  );
}
