import type { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
}

/**
 * Full-width edge-to-edge responsive grid layout for movie catalogs
 */
export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
