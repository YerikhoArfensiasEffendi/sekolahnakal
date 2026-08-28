/**
 * ArtPlayer.js Clean HTML5 Video Player Integration (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - 🎬 Layar Bersih 100% (Bebas Watermark & Bebas Popup)
 * - 🚫 Nonaktifkan Menu Klik Kanan & Nonaktifkan Tombol Screenshot
 * - 🔒 Proteksi Anti-Download (controlsList nodownload, URL blob masking)
 * - 🛡️ Proteksi Anti-Screen Recording (Netflix DRM Blackout saat deteksi capture/screen sharing)
 * - ⚡ HLS (.m3u8) & Direct MP4 playback dengan multi-resolusi
 */

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import type { StreamingData } from '@/types/movie';
import { streamingService } from '@/services/streaming.service';
import { movieStore } from '@/services/movieStore.service';
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
  const [isScreenCaptureBlocked, setIsScreenCaptureBlocked] = useState(false);

  // Anti-Screen Recording & Screenshot Interceptor
  useEffect(() => {
    const cleanup = initScreenCaptureDetection((detected) => {
      setIsScreenCaptureBlocked(detected);
      if (detected && artInstanceRef.current) {
        artInstanceRef.current.pause();
      }
    });

    return () => cleanup();
  }, []);

  useEffect(() => {
    if (!artContainerRef.current) return;

    const defaultSource = streamingData.sources[0];
    const initialUrl = defaultSource?.url || '';

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

    // Inisialisasi Artplayer Bersih & Mulus
    const artOptions: any = {
      container: artContainerRef.current,
      url: initialUrl,
      poster: streamingData.poster,
      theme: '#e50914', // Brand red
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: false, // Nonaktifkan PiP agar tidak bisa digrab extension downloader
      autoSize: false,
      autoMini: false,
      screenshot: false, // NONAKTIFKAN TOMBOL SCREENSHOT
      setting: true, // Menu gear setting
      loop: false,
      flip: false,
      playbackRate: true, // 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
      aspectRatio: true, // 16:9, 4:3, Auto
      fullscreen: true, // Layar penuh
      fullscreenWeb: true, // Layar penuh halaman
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: false,
      lock: true, // Kunci layar mobile
      fastForward: true, // Tahan layar untuk percepat 2x (ala YouTube)
      autoOrientation: true, // Rotasi otomatis di HP
      contextmenu: [], // Hapus context menu
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        playsInline: true,
        preload: 'auto',
        controlsList: 'nodownload noplaybackrate noremoteplayback', // Hilangkan download bawaan browser
        disablePictureInPicture: true,
        oncontextmenu: 'return false;', // Blokir klik kanan
      },
      customType: {
        m3u8: playM3u8,
        'application/x-mpegURL': playM3u8,
        'application/vnd.apple.mpegurl': playM3u8,
      },
      controls: [],
      icons: {
        state: `<svg width="60" height="60" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.6)" stroke="#e50914" stroke-width="2.5"/><path d="M19 15L33 24L19 33V15Z" fill="#ffffff"/></svg>`,
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

    // 1. Musnahkan elemen contextmenu Artplayer dari DOM
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

    // 1b. Deteksi durasi nyata video saat metadata stream dimuat
    const syncRealDuration = () => {
      const realDur = Math.round(art.video.duration || art.duration || 0);
      if (realDur > 0 && isFinite(realDur)) {
        movieStore.update(movieId, { duration: realDur });
        window.dispatchEvent(
          new CustomEvent('sekolah_nakal_video_duration_detected', {
            detail: { movieId, duration: realDur },
          })
        );
      }
    };

    art.on('video:loadedmetadata', syncRealDuration);
    art.on('video:durationchange', syncRealDuration);

    // 2. Cek watch progress terakhir (Auto-resume)
    streamingService.getProgress(movieId).then((prog) => {
      if (prog && prog.currentTime > 10 && prog.currentTime < prog.duration * 0.95) {
        art.notice.show = `Melanjutkan tontonan di ${Math.floor(prog.currentTime / 60)}:${Math.floor(prog.currentTime % 60).toString().padStart(2, '0')}`;
        art.currentTime = prog.currentTime;
      }
    });

    // 3. Simpan progress menonton secara berkala dan saat play/pause
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
      if (Math.abs(current - lastSavedTime) > 3) {
        saveCurrentProgress();
      }
    });

    // 4. Callback ready
    art.on('ready', () => {
      try {
        if (art.template && (art.template as any).$contextmenu) {
          (art.template as any).$contextmenu.remove();
        }
      } catch {
        // ignore
      }
      if (onReady) onReady(art);
    });

    // 5. Intercept event contextmenu pada level capture
    const container = artContainerRef.current;
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    container.addEventListener('contextmenu', blockContextMenu, { capture: true });

    // Cleanup saat unmount
    return () => {
      container.removeEventListener('contextmenu', blockContextMenu, { capture: true });
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [movieId, streamingData]);

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      className={`relative w-full aspect-video max-h-[75vh] overflow-hidden bg-black rounded-2xl border border-zinc-800 shadow-2xl select-none ${className || ''}`}
    >
      {/* ArtPlayer Container (Layar Bersih Total) */}
      <div
        ref={artContainerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        className={`w-full h-full ${isScreenCaptureBlocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />

      {/* Netflix-Style DRM Blackout Overlay saat terdeteksi screenshot / screen recording */}
      {isScreenCaptureBlocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/98 p-6 text-center select-none animate-in fade-in duration-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/40 text-red-500 shadow-2xl mb-3">
            <IconLock className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
            Tangkapan / Perekaman Layar Diblokir
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-1.5 leading-relaxed">
            Konten ini bersifat pribadi dan dilindungi hak cipta eksklusif Sekolah Nakal. Screenshot, perekaman layar, atau screen sharing tidak diizinkan.
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
