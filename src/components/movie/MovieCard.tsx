/**
 * MovieCard Component with Dynamic Live Hover Preview (Sekolah Nakal)
 * Optimized for Safari 60fps & WebKit GPU rendering
 */

import React, { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { watchPath } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconLock,
  IconPlay,
} from '@/components/icons';
import { DynamicThumbnail } from './DynamicThumbnail';

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'progress';
  progress?: number; // 0-1 for continue watching
  className?: string;
}

export const MovieCard = React.memo(function MovieCard({
  movie,
  variant = 'default',
  progress,
  className,
}: MovieCardProps) {
  const { hasAccessToTier } = useAuth();
  const isLocked = Boolean(movie.tier && movie.tier !== 'regular' && !hasAccessToTier(movie.tier));

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Synchronous resolution of preview source (No async IndexedDB lag)
  const previewVideoSource = movie.previewUrl || movie.videoUrl || '';

  const handleMouseEnter = () => {
    if (isLocked || !previewVideoSource) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsPlayingPreview(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsVideoPlaying(true))
            .catch(() => setIsVideoPlaying(false));
        }
      }
    }, 60);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPlayingPreview(false);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  const cardRating = useMemo(() => {
    if (movie.rating && movie.rating > 0) {
      return movie.rating.toFixed(1);
    }
    return '9.5';
  }, [movie.rating]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative block select-none video-catalog-item transition-transform duration-150 hover:z-20 will-change-transform',
        className
      )}
    >
      <Link
        to={watchPath(movie.id)}
        className="block cursor-pointer"
        aria-label={`Putar video ${movie.title}`}
      >
        {/* 16:9 Video Thumbnail Frame with Inline Video Motion Preview */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 transition-transform duration-150 group-hover:scale-[1.02] shadow-md group-hover:shadow-2xl">
          {/* Dynamic High-Impact Cinematic Thumbnail Artwork */}
          <div className={cn('h-full w-full', isPlayingPreview && isVideoPlaying ? 'opacity-0' : 'opacity-100')}>
            <DynamicThumbnail movie={movie} isLocked={isLocked} />
          </div>

          {/* Inline Auto-Playing Moving Video Preview on Hover ONLY (Muted & Loop) */}
          {!isLocked && isPlayingPreview && previewVideoSource && (
            <video
              ref={videoRef}
              src={previewVideoSource}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (dur && !isNaN(dur) && dur > 0) {
                  setDetectedDuration(Math.round(dur));
                }
              }}
              onLoadedData={() => setIsVideoPlaying(true)}
              onPlaying={() => setIsVideoPlaying(true)}
              onError={() => {
                setIsVideoPlaying(false);
                setIsPlayingPreview(false);
              }}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-150 pointer-events-none z-10',
                isVideoPlaying ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* Locked Overlay for unverified tiers (Solid lightweight background for Safari 60fps) */}
          {isLocked ? (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 text-center select-none z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-white/25 text-white shadow-lg mb-1.5">
                <IconLock className="w-4 h-4 text-amber-400" />
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                  movie.tier === 'vvip'
                    ? 'bg-black text-amber-300 border-amber-400/60'
                    : movie.tier === 'vip'
                    ? 'bg-black text-purple-300 border-purple-400/60'
                    : 'bg-black text-cyan-300 border-cyan-400/60'
                }`}
              >
                {movie.tier === 'vvip' && <IconCrown className="w-3 h-3 text-amber-400" />}
                {movie.tier === 'vip' && <IconStar className="w-3 h-3 text-purple-400" />}
                {movie.tier === 'talent' && <IconDiamond className="w-3 h-3 text-cyan-400" />}
                <span>ROLE {movie.tier?.toUpperCase()}</span>
              </div>
              <span className="text-[10px] font-semibold text-white/90 mt-1">
                Terkunci • Butuh Role
              </span>
            </div>
          ) : (
            <>
              {/* Video Duration Badge (or Live PREVIEW indicator when playing) */}
              <div className="absolute bottom-2 right-2 z-20 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[11px] font-bold font-mono text-white shadow-md leading-none border border-white/10 flex items-center gap-1">
                {isPlayingPreview && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                )}
                <span>{isPlayingPreview ? 'PREVIEW' : formatDuration(detectedDuration || movie.duration)}</span>
              </div>

              {/* Tier Badge */}
              {movie.tier && movie.tier !== 'regular' ? (
                <div
                  className={`absolute top-2 left-2 z-20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md border flex items-center gap-1 ${
                    movie.tier === 'vvip'
                      ? 'bg-black/90 text-amber-300 border-amber-400/50'
                      : movie.tier === 'vip'
                      ? 'bg-black/90 text-purple-300 border-purple-400/50'
                      : 'bg-black/90 text-cyan-300 border-cyan-400/50'
                  }`}
                >
                  {movie.tier === 'vvip' && <IconCrown className="w-3 h-3" />}
                  {movie.tier === 'vip' && <IconStar className="w-3 h-3" />}
                  {movie.tier === 'talent' && <IconDiamond className="w-3 h-3" />}
                  <span>{movie.tier.toUpperCase()}</span>
                </div>
              ) : (
                <div className="absolute top-2 left-2 z-20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md border bg-black/90 text-white border-white/20">
                  <span>REGULER</span>
                </div>
              )}

              {/* Centered Play Icon on Hover */}
              {!isPlayingPreview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 border border-white/40 text-white shadow-2xl scale-95 group-hover:scale-100 transition-transform duration-150 pl-0.5">
                    <IconPlay className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Progress bar for continue watching */}
          {variant === 'progress' && progress !== undefined && (
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/30 z-20">
              <div
                className="h-full bg-brand"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Details Below Thumbnail */}
        <div className="mt-2 space-y-0.5 px-0.5">
          <h3 className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-brand transition-colors leading-snug">
            {movie.title}
          </h3>
          <p className="text-[11px] text-text-muted flex items-center gap-1">
            <span>Official Sekolah Nakal</span>
            <span className="text-brand text-[10px]">✓</span>
          </p>
          <p className="text-[11px] text-text-muted/80 flex items-center gap-1.5 font-mono">
            {cardRating && (
              <>
                <span className="text-yellow-400 font-bold">★ {cardRating}</span>
                <span>•</span>
              </>
            )}
            <span>{(movie.genres || []).slice(0, 2).join(' • ')}</span>
            <span>•</span>
            <span>{movie.year}</span>
          </p>
        </div>
      </Link>
    </div>
  );
});
