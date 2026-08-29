/**
 * ArtPlayer.js Clean HTML5 Video Player Integration (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - 🎬 Layar Bersih 100% (Bebas Watermark & Bebas Popup)
 * - 🚫 Nonaktifkan Menu Klik Kanan & Nonaktifkan Tombol Screenshot
 * - 🔒 Proteksi Anti-Download (controlsList nodownload, URL blob masking)
 * - 🛡️ Proteksi Anti-Screen Recording (Netflix DRM Blackout saat deteksi capture/screen sharing)
 * - ⚡ HLS (.m3u8) & Direct MP4 playback dengan multi-resolusi stabil tanpa buffering loop
 */

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import type { StreamingData } from '@/types/movie';
import { streamingService } from '@/services/streaming.service';
import { initScreenCaptureDetection } from '@/lib/antiScreenRecord';
import { IconLock } from '@/components/icons';

interface ArtPlayerProps {
  movieId: string;
  streamingData: StreamingData;
  className?: string;
  onReady?: (art: Artplayer) => void;
}

export function ArtPlayerComponent({ movieId, streamingData, className, onReady }: ArtPlayerProps) {
  const artContainerRef = useRef<HTMLDivElement | null>(null);
  const artInstanceRef = useRef<Artplayer | null>(null);
  const hasSyncedDurationRef = useRef<boolean>(false);
  const [isScreenCaptureBlocked, setIsScreenCaptureBlocked] = useState(false);

  // Anti-Screen Recording & Screenshot Interceptor (Non-intrusive)
  useEffect(() => {
    const cleanup = initScreenCaptureDetection((detected) => {
      setIsScreenCaptureBlocked(detected);
      if (detected && artInstanceRef.current) {
        artInstanceRef.current.pause();
      }
    });

    return () => cleanup();
  }, []);

  const defaultSource = streamingData.sources[0];
  const initialUrl = defaultSource?.url || '';

  useEffect(() => {
    if (!artContainerRef.current || !initialUrl) return;

    hasSyncedDurationRef.current = false;

    // Ambil subtitle default jika ada
    const defaultSub = streamingData.subtitles.find((s) => s.default) || streamingData.subtitles[0];

    // Konfigurasi Hls.js untuk format .m3u8
    const playM3u8 = (video: HTMLVideoElement, url: string, art: Artplayer) => {
      if (Hls.isSupported()) {
        const existingHls = (art as any).hls as Hls | undefined;
        if (existingHls) existingHls.destroy();

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        (art as any).hls = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          if (data.levels && data.levels.length > 1) {
            const qualityList = data.levels.map((level, index) => ({
              default: index === 0,
              html: `${level.height}P`,
              url,
              level: index,
            }));

            qualityList.unshift({
              default: true,
              html: 'Auto (HD)',
              url,
              level: -1,
            });

            art.controls.update({
              name: 'quality',
              index: 20,
              position: 'right',
              html: 'Auto',
              selector: qualityList,
              onSelect: (item: any) => {
                hls.currentLevel = item.level;
                return item.html;
              },
            });
          }
        });

        art.on('destroy', () => {
          hls.destroy();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        art.notice.show = 'Browser Anda tidak mendukung pemutaran HLS (.m3u8)';
      }
    };

    // Quality list untuk MP4 multiple source
    const qualityOptions = streamingData.sources.map((src, i) => ({
      default: i === 0,
      html: src.quality || `${1080 - i * 360}p`,
      url: src.url,
    }));

    const isHls = initialUrl.includes('.m3u8') || initialUrl.includes('application/x-mpegURL');

    // Inisialisasi Artplayer Bersih & Mulus
    const artOptions: any = {
      container: artContainerRef.current,
      url: initialUrl,
      type: isHls ? 'm3u8' : 'mp4',
      poster: streamingData.poster,
      theme: '#ff3378', // Brand Pink
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: false,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false, // NONAKTIFKAN autoPlayback internal agar tidak konflik dengan streaming seek
      airplay: false,
      lock: true,
      fastForward: true,
      autoOrientation: true,
      contextmenu: [],
      moreVideoAttr: {
        playsInline: true,
        preload: 'metadata',
        controlsList: 'nodownload noplaybackrate noremoteplayback',
        disablePictureInPicture: true,
        oncontextmenu: 'return false;',
      },
      customType: isHls
        ? {
            m3u8: playM3u8,
            'application/x-mpegURL': playM3u8,
            'application/vnd.apple.mpegurl': playM3u8,
          }
        : {},
      controls: [],
      icons: {
        state: `<svg width="60" height="60" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.6)" stroke="#ff3378" stroke-width="2.5"/><path d="M19 15L33 24L19 33V15Z" fill="#ffffff"/></svg>`,
      },
    };

    if (qualityOptions.length > 1) {
      artOptions.quality = qualityOptions;
    }

    if (defaultSub && defaultSub.url) {
      artOptions.subtitle = {
        url: defaultSub.url,
        type: 'vtt',
        style: {
          color: '#ffffff',
          fontSize: '20px',
          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
        },
        encoding: 'utf-8',
      };
    }

    let art: Artplayer;
    try {
      art = new Artplayer(artOptions);
    } catch (e) {
      console.error('ArtPlayer init error:', e);
      return;
    }

    try {
      if (art.template && (art.template as any).$contextmenu) {
        (art.template as any).$contextmenu.remove();
      }
      if (art.contextmenu) {
        art.contextmenu.show = false;
      }
    } catch {
      // ignore
    }

    artInstanceRef.current = art;

    // Deteksi durasi video (Sekali saja per load, tanpa memicu destroy/recreate)
    const syncRealDuration = () => {
      if (hasSyncedDurationRef.current) return;
      const realDur = Math.round(art.video.duration || art.duration || 0);
      if (realDur > 0 && isFinite(realDur)) {
        hasSyncedDurationRef.current = true;
        window.dispatchEvent(
          new CustomEvent('sekolah_nakal_video_duration_detected', {
            detail: { movieId, duration: realDur },
          })
        );
      }
    };

    art.on('video:loadedmetadata', syncRealDuration);

    // Auto-resume aman saat video siap
    streamingService.getProgress(movieId).then((prog) => {
      if (prog && prog.currentTime > 10 && prog.currentTime < prog.duration * 0.95) {
        art.notice.show = `Melanjutkan tontonan di ${Math.floor(prog.currentTime / 60)}:${Math.floor(prog.currentTime % 60).toString().padStart(2, '0')}`;
        art.once('video:canplay', () => {
          try {
            if (art.currentTime === 0) {
              art.currentTime = prog.currentTime;
            }
          } catch {}
        });
      }
    });

    // Simpan progress menonton secara aman
    let lastSavedTime = 0;
    const saveCurrentProgress = () => {
      const current = art.currentTime;
      const dur = art.duration || 0;
      if (current >= 0 && isFinite(current)) {
        lastSavedTime = current;
        streamingService.saveProgress({
          movieId,
          currentTime: current,
          duration: dur,
          updatedAt: new Date().toISOString(),
        });
      }
    };

    art.on('video:play', saveCurrentProgress);
    art.on('video:pause', saveCurrentProgress);
    art.on('video:ended', saveCurrentProgress);

    art.on('video:timeupdate', () => {
      const current = art.currentTime;
      if (Math.abs(current - lastSavedTime) > 5) {
        saveCurrentProgress();
      }
    });

    art.on('error', (err: any) => {
      console.warn('ArtPlayer playback event:', err);
    });

    art.on('ready', () => {
      try {
        if (art.template && (art.template as any).$contextmenu) {
          (art.template as any).$contextmenu.remove();
        }
      } catch {}
      if (onReady) onReady(art);
    });

    const container = artContainerRef.current;
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    container.addEventListener('contextmenu', blockContextMenu, { capture: true });

    return () => {
      container.removeEventListener('contextmenu', blockContextMenu, { capture: true });
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [movieId, initialUrl]); // Dependency terkontrol hanya pada movieId dan initialUrl

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      className={`relative w-full aspect-video max-h-[75vh] overflow-hidden bg-black rounded-2xl border border-zinc-800 shadow-2xl select-none ${className || ''}`}
    >
      <div
        ref={artContainerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        className={`w-full h-full ${isScreenCaptureBlocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />

      {isScreenCaptureBlocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/98 p-6 text-center select-none animate-in fade-in duration-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/40 text-red-500 shadow-2xl mb-3">
            <IconLock className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
            Tangkapan Layar Terdeteksi
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-1.5 leading-relaxed">
            Konten ini bersifat pribadi dan dilindungi hak cipta eksklusif Sekolah Nakal.
          </p>
          <button
            onClick={() => {
              setIsScreenCaptureBlocked(false);
              if (artInstanceRef.current) {
                artInstanceRef.current.play();
              }
            }}
            className="mt-5 px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white border border-white/25 transition-all cursor-pointer"
          >
            Lanjutkan Menonton
          </button>
        </div>
      )}
    </div>
  );
}
