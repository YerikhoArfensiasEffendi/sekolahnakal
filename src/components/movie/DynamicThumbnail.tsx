/**
 * Dynamic Cinematic Thumbnail & Artwork Generator (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menampilkan thumbnail asli dari server jika tersedia
 * - Auto-capture snapshot cuplikan video secara dinamis via client-side video canvas
 * - Fallback bersih ke kartu logo resmi Sekolah Nakal jika offline/tanpa media
 */

import { useState, useEffect } from 'react';
import type { Movie } from '@/types/movie';
import { cn } from '@/utils/cn';
import { getDirectStreamUrl } from '@/utils/videoEmbed';

interface DynamicThumbnailProps {
  movie: Movie;
  className?: string;
  isLocked?: boolean;
}

const dynamicThumbCache = new Map<string, string>();

export function DynamicThumbnail({
  movie,
  className,
  isLocked = false,
}: DynamicThumbnailProps) {
  const [imgError, setImgError] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(() => {
    return dynamicThumbCache.get(movie.id) || null;
  });

  const posterSource = movie.backdropUrl || movie.posterUrl;
  const isCustomImage =
    posterSource &&
    posterSource !== '/images/logo_v2.png' &&
    !posterSource.endsWith('/images/logo_v2.png') &&
    posterSource !== '/images/logo.png' &&
    !posterSource.endsWith('/images/logo.png') &&
    !imgError;

  // Auto-capture video snapshot frame jika poster belum ada dan videoUrl aktif
  useEffect(() => {
    if (isCustomImage || capturedFrame || !movie.videoUrl) return;

    const streamUrl = getDirectStreamUrl(movie.videoUrl);
    if (!streamUrl || streamUrl.includes('/uploads/videos/') || streamUrl.includes('dood') || streamUrl.includes('streamtape')) {
      return;
    }

    if (dynamicThumbCache.has(movie.id)) {
      setCapturedFrame(dynamicThumbCache.get(movie.id)!);
      return;
    }

    let isMounted = true;
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.src = streamUrl;
    vid.muted = true;
    vid.preload = 'metadata';

    const handleLoadedMetadata = () => {
      const dur = vid.duration && isFinite(vid.duration) ? vid.duration : 10;
      const targetTime = Math.min(2.0, Math.max(0.1, dur * 0.1));
      vid.currentTime = targetTime;
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (ctx && isMounted) {
          ctx.drawImage(vid, 0, 0, 480, 270);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          dynamicThumbCache.set(movie.id, dataUrl);
          setCapturedFrame(dataUrl);
        }
      } catch {
        // ignore cross-origin canvas security errors
      } finally {
        vid.remove();
      }
    };

    vid.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    vid.addEventListener('seeked', handleSeeked, { once: true });

    return () => {
      isMounted = false;
      vid.remove();
    };
  }, [movie.id, movie.videoUrl, isCustomImage, capturedFrame]);

  // Tampilkan gambar asli dari server atau canvas snapshot
  const finalImageSrc = isCustomImage ? posterSource : capturedFrame;

  if (finalImageSrc) {
    return (
      <img
        src={finalImageSrc}
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

  // Render Clean Logo Fallback Card
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
