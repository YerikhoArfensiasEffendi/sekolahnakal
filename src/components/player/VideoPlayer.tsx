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
  const isEmbed = activeSource ? isEmbedUrl(activeSource.url) : false;
  const embedSrc = activeSource ? extractEmbedUrl(activeSource.url) : '';

  // Jika URL berupa embed iframe (Doodstream/Streamtape), gunakan iframe wrapper
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
