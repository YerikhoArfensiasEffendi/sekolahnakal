import { Badge } from '@/components/ui/Badge';
import { formatDuration } from '@/utils/format';

interface MovieMetaProps {
  year: number;
  duration: number;
  rating: number;
  genres: string[];
  maturityRating?: string;
}

/**
 * Reusable movie metadata cluster.
 * Used in MovieDetail, MovieHero, etc.
 */
export function MovieMeta({ year, duration, rating, genres, maturityRating }: MovieMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-medium text-success">⭐ {rating.toFixed(1)}</span>
      <span className="text-text-secondary">{year}</span>
      <span className="text-text-secondary">{formatDuration(duration)}</span>
      {maturityRating && (
        <Badge>{maturityRating}</Badge>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(genres || []).map((genre) => (
          <Badge key={genre} variant="brand">{genre}</Badge>
        ))}
      </div>
    </div>
  );
}
