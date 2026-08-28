/**
 * MovieCard Component with Dynamic Live Hover Preview (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Live Video Motion Preview saat kursor hover (menggunakan file video asli yang diunggah)
 * - Auto-fallback thumbnail langsung dari frame video (.mp4#t=2.0) jika poster gambar belum ada
 * - Tier Badge & Durasi dinamis
 * - Proteksi akses tier terkunci
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { watchPath } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { videoStorageService } from '@/services/videoStorage.service';
import { movieStore } from '@/services/movieStore.service';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconLock,
  IconPlay,
} from '@/components/icons';
import { DynamicThumbnail } from './DynamicThumbnail';

const SAMPLE_PREVIEW_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'progress';
  progress?: number; // 0-1 for continue watching
  className?: string;
}

export function MovieCard({ movie, variant = 'default', progress, className }: MovieCardProps) {
  const { hasAccessToTier } = useAuth();
  const isLocked = Boolean(movie.tier && movie.tier !== 'regular' && !hasAccessToTier(movie.tier));

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [actualVideoUrl, setActualVideoUrl] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Ambil URL file video asli (jika ada di IndexedDB atau URL kustom)
  useEffect(() => {
    let isMounted = true;

    async function loadVideoSource() {
      // 1. Cek dari IndexedDB
      const blobUrl = await videoStorageService.getVideoUrl(movie.id);
      if (blobUrl && isMounted) {
        setActualVideoUrl(blobUrl);
        return;
      }

      // 2. Cek dari direct custom URL
      const customUrl = movieStore.getVideoUrl(movie.id);
      if (customUrl && isMounted) {
        setActualVideoUrl(customUrl);
        return;
      }

      // 3. Fallback ke sample video
      if (isMounted) {
        const numId = parseInt(movie.id, 10) || 1;
        setActualVideoUrl(SAMPLE_PREVIEW_VIDEOS[(numId - 1) % SAMPLE_PREVIEW_VIDEOS.length]!);
      }
    }

    loadVideoSource();
    return () => {
      isMounted = false;
    };
  }, [movie.id]);

  // Validasi URL preview agar HTML5 video tidak crash/blank hitam
  const previewVideoSource = useMemo(() => {
    if (!actualVideoUrl) {
      const numId = parseInt(movie.id, 10) || 1;
      return SAMPLE_PREVIEW_VIDEOS[(numId - 1) % SAMPLE_PREVIEW_VIDEOS.length]!;
    }
    const isPlayableDirect =
      actualVideoUrl.startsWith('blob:') ||
      actualVideoUrl.startsWith('data:') ||
      /\.(mp4|webm|mov|mkv|m4v)(\?.*)?$/i.test(actualVideoUrl);
    if (isPlayableDirect) return actualVideoUrl;

    const numId = parseInt(movie.id, 10) || 1;
    return SAMPLE_PREVIEW_VIDEOS[(numId - 1) % SAMPLE_PREVIEW_VIDEOS.length]!;
  }, [actualVideoUrl, movie.id]);

  const handleMouseEnter = () => {
    if (isLocked || !previewVideoSource) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsPlayingPreview(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setIsVideoPlaying(false);
          });
        }
      }
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPlayingPreview(false);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const [likesState, setLikesState] = useState(() => Number(localStorage.getItem(`sn_likes_${movie.id}`)) || 0);
  const [dislikesState, setDislikesState] = useState(() => Number(localStorage.getItem(`sn_dislikes_${movie.id}`)) || 0);

  useEffect(() => {
    const handleRatingUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ movieId: string }>;
      if (!custom.detail || custom.detail.movieId === movie.id) {
        setLikesState(Number(localStorage.getItem(`sn_likes_${movie.id}`)) || 0);
        setDislikesState(Number(localStorage.getItem(`sn_dislikes_${movie.id}`)) || 0);
      }
    };
    window.addEventListener('sekolah_nakal_ratings_updated', handleRatingUpdated);
    return () => window.removeEventListener('sekolah_nakal_ratings_updated', handleRatingUpdated);
  }, [movie.id]);

  const totalVotes = likesState + dislikesState;
  const cardRating = useMemo(() => {
    if (totalVotes > 0) {
      return ((likesState / totalVotes) * 10).toFixed(1);
    }
    return null;
  }, [totalVotes, likesState]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative block select-none video-catalog-item transition-all duration-200 hover:z-20',
        className
      )}
    >
      <Link
        to={watchPath(movie.id)}
        className="block cursor-pointer"
        aria-label={`Putar video ${movie.title}`}
      >
        {/* 16:9 Video Thumbnail Frame with Inline Video Motion Preview */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-border/50 transition-all duration-200 group-hover:scale-[1.02] shadow-md group-hover:shadow-2xl">
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
              onPlaying={() => setIsVideoPlaying(true)}
              onError={() => {
                setIsVideoPlaying(false);
                setIsPlayingPreview(false);
              }}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-200 pointer-events-none',
                isVideoPlaying ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* Locked Blurry Overlay for unverified tiers */}
          {isLocked ? (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center select-none z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/90 border border-white/25 text-white shadow-lg mb-1.5">
                <IconLock className="w-4 h-4 text-amber-400" />
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                  movie.tier === 'vvip'
                    ? 'bg-black/90 text-amber-300 border-amber-400/60'
                    : movie.tier === 'vip'
                    ? 'bg-black/90 text-purple-300 border-purple-400/60'
                    : 'bg-black/90 text-cyan-300 border-cyan-400/60'
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
                <span>{isPlayingPreview ? 'PREVIEW' : formatDuration(movie.duration)}</span>
              </div>

              {/* Tier Badge */}
              {movie.tier && movie.tier !== 'regular' ? (
                <div
                  className={`absolute top-2 left-2 z-20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border flex items-center gap-1 ${
                    movie.tier === 'vvip'
                      ? 'bg-black/85 text-amber-300 border-amber-400/50'
                      : movie.tier === 'vip'
                      ? 'bg-black/85 text-purple-300 border-purple-400/50'
                      : 'bg-black/85 text-cyan-300 border-cyan-400/50'
                  }`}
                >
                  {movie.tier === 'vvip' && <IconCrown className="w-3 h-3" />}
                  {movie.tier === 'vip' && <IconStar className="w-3 h-3" />}
                  {movie.tier === 'talent' && <IconDiamond className="w-3 h-3" />}
                  <span>{movie.tier.toUpperCase()}</span>
                </div>
              ) : (
                <div className="absolute top-2 left-2 z-20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border bg-black/85 text-white border-white/20">
                  <span>REGULER</span>
                </div>
              )}

              {/* Glassmorphic Centered Play Icon on Hover when not in moving preview */}
              {!isPlayingPreview && (
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 border border-white/40 text-white shadow-2xl backdrop-blur-md scale-90 group-hover:scale-100 transition-transform duration-200 pl-0.5">
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

        {/* Video Details Below Thumbnail (YouTube Style) */}
        <div className="mt-2.5 space-y-1 px-0.5">
          <h3 className="truncate text-sm font-bold text-white group-hover:text-brand transition-colors leading-snug">
            {movie.title}
          </h3>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <span>Official Sekolah Nakal</span>
            <span className="text-brand text-[10px]">✓</span>
          </p>
          <p className="text-[11px] text-text-muted/80 flex items-center gap-1.5">
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
}
