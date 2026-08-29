/**
 * Dynamic Cinematic Thumbnail & Artwork Generator (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menampilkan thumbnail asli dari server jika tersedia
 * - Fallback bersih & aman ke kartu logo resmi Sekolah Nakal tanpa error CORS & tanpa memory leak
 */

import { useState } from 'react';
import type { Movie } from '@/types/movie';
import { cn } from '@/utils/cn';

interface DynamicThumbnailProps {
  movie: Movie;
  className?: string;
  isLocked?: boolean;
}

export function DynamicThumbnail({
  movie,
  className,
  isLocked = false,
}: DynamicThumbnailProps) {
  const [imgError, setImgError] = useState(false);

  const posterSource = movie.posterUrl || movie.backdropUrl;
  const hasValidImage =
    posterSource &&
    posterSource !== '/images/logo_v2.png' &&
    !posterSource.endsWith('/images/logo_v2.png') &&
    posterSource !== '/images/logo.png' &&
    !posterSource.endsWith('/images/logo.png') &&
    !imgError;

  if (hasValidImage) {
    return (
      <img
        src={posterSource}
        alt={movie.title}
        loading="lazy"
        onError={() => setImgError(true)}
        className={cn(
          'h-full w-full object-cover transition-all duration-300',
          isLocked ? 'filter blur-md brightness-40 contrast-125' : 'group-hover:scale-105',
          className
        )}
      />
    );
  }

  // Render Clean Logo Fallback Card (Tanpa Network Request & Tanpa CORS Error)
  return (
    <div
      className={cn(
        'relative h-full w-full bg-[#0a0a0c] flex items-center justify-center p-4 overflow-hidden select-none border border-zinc-850',
        className
      )}
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-950/20 via-black/80 to-zinc-950/90 pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Official Sekolah Nakal Logo in Center */}
      <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <img
          src="/images/logo_v2.png"
          alt="Sekolah Nakal"
          className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,51,120,0.3)] opacity-90 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}
