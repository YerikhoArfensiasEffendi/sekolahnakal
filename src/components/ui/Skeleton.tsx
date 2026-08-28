import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-hover',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rect' && 'rounded-lg',
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a movie card */
export function MovieCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

/** Skeleton for a movie row section */
export function MovieRowSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" className="h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 sm:w-44 md:w-48">
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the hero section */
export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] w-full">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}
