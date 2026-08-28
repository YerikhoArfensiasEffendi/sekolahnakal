import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { movieService } from '@/services/movie.service';
import { categoryStore } from '@/services/categoryStore.service';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { MovieCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Genre() {
  const { slug } = useParams<{ slug: string }>();
  const [genre, setGenre] = useState(slug ? categoryStore.getBySlug(slug) : undefined);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const loadMovies = async () => {
    if (!slug) return;
    setStatus('loading');
    try {
      const data = await movieService.getByGenre(slug);
      setMovies(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const genreDisplayName =
    genre?.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Genre');

  useEffect(() => {
    const handleUpdate = () => {
      if (slug) {
        setGenre(categoryStore.getBySlug(slug));
      }
    };
    window.addEventListener('sekolah_nakal_categories_updated', handleUpdate);
    return () => window.removeEventListener('sekolah_nakal_categories_updated', handleUpdate);
  }, [slug]);

  useEffect(() => {
    loadMovies();
    const currentGenre = slug ? categoryStore.getBySlug(slug) : undefined;
    setGenre(currentGenre);
    const titleName = currentGenre?.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Genre');
    document.title = `${titleName} — Sekolah Nakal`;
  }, [slug]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-text-primary md:text-3xl">
        {genreDisplayName}
      </h1>

      {status === 'loading' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      )}
      {status === 'error' && <ErrorState onRetry={loadMovies} />}
      {status === 'success' && movies.length === 0 && (
        <EmptyState message="Tidak ada film untuk genre ini" />
      )}
      {status === 'success' && movies.length > 0 && <MovieGrid movies={movies} />}
    </div>
  );
}
