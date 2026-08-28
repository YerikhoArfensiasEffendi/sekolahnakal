/**
 * Dynamic Cinematic Thumbnail & Artwork Generator (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menghasilkan poster sinematik beresolusi tinggi otomatis berdasarkan Kategori, Tier & Judul
 * - Warna tema gradasi mewah (Arab: Gold/Emerald, Jepang: Neon Rose/Indigo, Lokal: Crimson Ruby, Barat: Cyan Navy, VVIP: Imperial Gold)
 * - Tampilan visual artistik profesional (Watermark Kategori, Glassmorphism Play Button, 4K UHD Badge)
 */

import { useState } from 'react';
import type { Movie } from '@/types/movie';
import { cn } from '@/utils/cn';
import { IconPlay } from '@/components/icons';

interface DynamicThumbnailProps {
  movie: Movie;
  className?: string;
  isLocked?: boolean;
  hidePlayButton?: boolean;
}

// Skema Palet Gradasi Mewah berdasarkan Kategori & Tier
function getCategoryTheme(genres: string[] = [], tier?: string) {
  const gStr = (genres.join(' ') + ' ' + (tier || '')).toLowerCase();

  if (gStr.includes('arab')) {
    return {
      gradient: 'from-amber-900/90 via-yellow-950/70 to-emerald-950/95',
      border: 'border-amber-500/30',
      tagBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: '🇸🇦',
      watermark: 'ARAB',
      accentGlow: 'bg-amber-500/15',
    };
  }

  if (gStr.includes('jepang') || gStr.includes('japan') || gStr.includes('jav') || gStr.includes('asia')) {
    return {
      gradient: 'from-rose-950/90 via-pink-950/70 to-purple-950/95',
      border: 'border-pink-500/30',
      tagBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      icon: '🇯🇵',
      watermark: 'JAPAN',
      accentGlow: 'bg-pink-500/15',
    };
  }

  if (gStr.includes('lokal') || gStr.includes('indo') || gStr.includes('siswa') || gStr.includes('teacher')) {
    return {
      gradient: 'from-red-950/90 via-zinc-950 to-rose-950/90',
      border: 'border-red-500/30',
      tagBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: '🇮🇩',
      watermark: 'LOKAL',
      accentGlow: 'bg-red-500/15',
    };
  }

  if (gStr.includes('barat') || gStr.includes('west') || gStr.includes('bule')) {
    return {
      gradient: 'from-cyan-950/90 via-slate-950 to-blue-950/95',
      border: 'border-cyan-500/30',
      tagBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: '🇺🇸',
      watermark: 'WEST',
      accentGlow: 'bg-cyan-500/15',
    };
  }

  if (gStr.includes('vvip') || gStr.includes('uncensored')) {
    return {
      gradient: 'from-amber-950/95 via-zinc-950 to-yellow-950/95',
      border: 'border-amber-400/40',
      tagBg: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
      icon: '👑',
      watermark: 'VVIP UNCENSORED',
      accentGlow: 'bg-amber-400/20',
    };
  }

  if (gStr.includes('vip')) {
    return {
      gradient: 'from-purple-950/95 via-zinc-950 to-violet-950/95',
      border: 'border-purple-500/30',
      tagBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '⭐',
      watermark: 'VIP STUDIO',
      accentGlow: 'bg-purple-500/15',
    };
  }

  if (gStr.includes('photo') || gStr.includes('food')) {
    return {
      gradient: 'from-violet-950/90 via-zinc-950 to-fuchsia-950/90',
      border: 'border-violet-500/30',
      tagBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      icon: '📸',
      watermark: 'MEDIA',
      accentGlow: 'bg-violet-500/15',
    };
  }

  // Default Sekolah Nakal Crimson Theme
  return {
    gradient: 'from-red-950/90 via-zinc-950 to-zinc-900',
    border: 'border-red-500/25',
    tagBg: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: '🔥',
    watermark: 'SEKOLAH NAKAL',
    accentGlow: 'bg-red-600/15',
  };
}

export function DynamicThumbnail({
  movie,
  className,
  isLocked = false,
  hidePlayButton = false,
}: DynamicThumbnailProps) {
  const [imgError, setImgError] = useState(false);

  const posterSource = movie.backdropUrl || movie.posterUrl;
  const isCustomImage =
    posterSource &&
    posterSource !== '/images/logo.png' &&
    !posterSource.includes('logo.png') &&
    !imgError;

  const categoryName = movie.genres?.[0] || 'Umum';
  const theme = getCategoryTheme(movie.genres, movie.tier);

  // Jika ada file gambar nyata dari uploader / screenshot
  if (isCustomImage) {
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

  // Render High-Aesthetic Cinematic Poster Card
  return (
    <div
      className={cn(
        `relative h-full w-full bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden select-none border ${theme.border}`,
        className
      )}
    >
      {/* Glowing Ambient Light in Background */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl pointer-events-none',
          theme.accentGlow
        )}
      />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-black/60 rounded-full blur-2xl pointer-events-none" />

      {/* Diagonal Film Reel Decorative Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-60 pointer-events-none" />

      {/* Large Background Watermark */}
      <div className="absolute bottom-1 right-2 text-[32px] sm:text-[42px] font-black tracking-tighter text-white/[0.04] uppercase pointer-events-none leading-none select-none">
        {theme.watermark}
      </div>

      {/* Top Header in Card: Category Badge & Format */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-md',
            theme.tagBg
          )}
        >
          <span>{theme.icon}</span>
          <span className="truncate max-w-[120px]">{categoryName}</span>
        </span>

        <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black uppercase bg-black/60 text-zinc-300 border border-white/10 shadow">
          {movie.tier === 'vvip' ? '4K ULTRA HD' : '1080P FULL HD'}
        </span>
      </div>

      {/* Center Centerpiece: Glowing Play Button */}
      {!hidePlayButton && !isLocked && (
        <div className="relative z-10 flex items-center justify-center my-auto">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-xl backdrop-blur-md group-hover:scale-110 group-hover:bg-brand group-hover:border-brand/80 transition-all duration-300">
            <IconPlay className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 text-white drop-shadow" />
          </div>
        </div>
      )}

      {/* Bottom Footer in Card: Title & Studio Watermark */}
      <div className="relative z-10 space-y-1">
        <h4 className="text-xs sm:text-[13px] font-black text-white line-clamp-2 leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] group-hover:text-cyan-200 transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="text-red-500 font-bold">●</span>
            <span className="tracking-wide">Sekolah Nakal</span>
          </span>
          <span className="font-mono text-zinc-500">{movie.year || 2026}</span>
        </div>
      </div>
    </div>
  );
}
