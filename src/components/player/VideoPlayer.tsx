/**
 * Modern Multi-Format Video Player (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Engine:
 * - ArtPlayer.js + HLS.js (100% Bebas Iklan, Multi-Quality, Mobile Touch Gestures, Screenshot, Mini-Player)
 * - Responsive Iframe Embed Fallback (untuk link Doodstream / Streamtape jika digunakan)
 */

import type { StreamingData } from '@/types/movie';
import { isEmbedUrl, extractEmbedUrl } from '@/utils/videoEmbed';
import { ArtPlayerComponent } from './ArtPlayer';

interface VideoPlayerProps {
  movieId: string;
  streamingData: StreamingData;
  className?: string;
}

export function VideoPlayer({ movieId, streamingData, className }: VideoPlayerProps) {
  const activeSource = streamingData.sources[0];
  const videoUrl = activeSource?.url?.trim() || '';

  // Jika URL kosong atau file lokal 404, tampilkan banner informatif tanpa infinite reconnect
  if (!videoUrl || videoUrl.includes('/uploads/videos/')) {
    return (
      <div
        className={`relative w-full aspect-video max-h-[75vh] overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-800/80 shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-3 ${className || ''}`}
      >
        <div className="text-4xl">⚠️</div>
        <h3 className="text-base sm:text-lg font-bold text-white">Sumber Video Belum Tersedia</h3>
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
          Video ini belum memiliki link streaming aktif atau sedang diproses di cloud storage. Silakan edit video di Studio Admin untuk memperbarui link streaming.
        </p>
      </div>
    );
  }

  const isEmbed = isEmbedUrl(videoUrl);
  const embedSrc = extractEmbedUrl(videoUrl);

  // Jika URL berupa embed iframe (ZeroStorage / Lulustream / Doodstream / Streamtape), gunakan iframe wrapper
  if (isEmbed) {
    return (
      <div
        className={`relative w-full aspect-video max-h-[75vh] overflow-hidden bg-black rounded-2xl border border-zinc-800 shadow-2xl flex items-center justify-center ${className || ''}`}
      >
        <iframe
          src={embedSrc}
          title={streamingData.title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Gunakan ArtPlayer.js modern untuk semua direct stream (MP4, HLS .m3u8, Telegram Stream, Bunny, dll.)
  return (
    <ArtPlayerComponent
      movieId={movieId}
      streamingData={streamingData}
      className={className}
    />
  );
}
