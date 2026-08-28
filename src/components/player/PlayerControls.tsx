import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/utils/format';
import type { SubtitleTrack, VideoSource } from '@/types/movie';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  subtitles: SubtitleTrack[];
  activeSubtitle: string | null;
  onSelectSubtitle: (lang: string | null) => void;
  sources: VideoSource[];
  activeQuality: string;
  onSelectQuality: (quality: string) => void;
  title: string;
  onBack: () => void;
  showControls: boolean;
}

export function PlayerControls({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  buffered,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  playbackRate,
  onChangePlaybackRate,
  subtitles,
  activeSubtitle,
  onSelectSubtitle,
  sources,
  activeQuality,
  onSelectQuality,
  title,
  onBack,
  showControls,
}: PlayerControlsProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubtitlesOpen, setIsSubtitlesOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(percent * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  // Close popup menus when clicking away or controls hide
  useEffect(() => {
    if (!showControls) {
      setIsSettingsOpen(false);
      setIsSubtitlesOpen(false);
    }
  }, [showControls]);

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/20 to-black/80 pointer-events-auto select-none"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 transition-colors focus-visible:outline-brand"
                aria-label="Kembali"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-base sm:text-xl font-bold text-white drop-shadow-md truncate max-w-md">
                {title}
              </h1>
            </div>

            {/* Scroll to Comments Button */}
            <button
              onClick={() => {
                const el = document.getElementById('comments-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-brand transition-colors"
            >
              <span>💬</span>
              <span className="hidden sm:inline">Komentar & Diskusi</span>
            </button>
          </div>

          {/* Bottom Bar Controls */}
          <div className="p-4 sm:p-6 space-y-3">
            {/* Timeline Progress Bar */}
            <div
              ref={progressBarRef}
              onClick={handleSeekClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverTime(null)}
              className="group/timeline relative h-2 hover:h-3 w-full cursor-pointer rounded-full bg-white/20 transition-all"
            >
              {/* Buffered Progress */}
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-white/30 transition-all"
                style={{ width: `${bufferedPercent}%` }}
              />

              {/* Current Played Progress */}
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-brand"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Handle thumb */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity" />
              </div>

              {/* Timestamp Hover Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-8 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 text-xs font-semibold text-white shadow"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between">
              {/* Left Group */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Play / Pause */}
                <button
                  onClick={onTogglePlay}
                  className="text-white hover:text-brand transition-colors focus-visible:outline-brand"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Seek Back 10s */}
                <button
                  onClick={() => onSeek(currentTime - 10)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Mundur 10 detik"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </button>

                {/* Seek Forward 10s */}
                <button
                  onClick={() => onSeek(currentTime + 10)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Maju 10 detik"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </button>

                {/* Volume & Mute */}
                <div className="group/vol flex items-center gap-2">
                  <button
                    onClick={onToggleMute}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-24 accent-brand cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Volume slider"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs sm:text-sm font-medium text-white/90">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 text-white/40">/</span>
                  <span className="text-white/60">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Group */}
              <div className="flex items-center gap-3 sm:gap-4 relative">
                {/* Subtitle Selector */}
                {subtitles.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsSubtitlesOpen(!isSubtitlesOpen);
                        setIsSettingsOpen(false);
                      }}
                      className={`text-sm px-2 py-1 rounded font-bold transition-colors ${
                        activeSubtitle ? 'bg-brand text-white' : 'text-white/80 hover:text-white bg-white/10'
                      }`}
                      aria-label="Subtitel"
                    >
                      CC
                    </button>

                    {isSubtitlesOpen && (
                      <div className="absolute bottom-10 right-0 w-44 rounded-xl bg-bg-surface/95 backdrop-blur-md border border-border p-2 shadow-2xl text-xs space-y-1 z-40">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Subtitel</p>
                        <button
                          onClick={() => {
                            onSelectSubtitle(null);
                            setIsSubtitlesOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                            activeSubtitle === null ? 'bg-brand text-white font-semibold' : 'text-text-secondary hover:bg-bg-hover'
                          }`}
                        >
                          Mati (Off)
                        </button>
                        {subtitles.map((sub) => (
                          <button
                            key={sub.language}
                            onClick={() => {
                              onSelectSubtitle(sub.language);
                              setIsSubtitlesOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                              activeSubtitle === sub.language
                                ? 'bg-brand text-white font-semibold'
                                : 'text-text-secondary hover:bg-bg-hover'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Speed & Quality Settings Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(!isSettingsOpen);
                      setIsSubtitlesOpen(false);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Pengaturan pemutar"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute bottom-10 right-0 w-48 rounded-xl bg-bg-surface/95 backdrop-blur-md border border-border p-2 shadow-2xl text-xs space-y-2 z-40">
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Kecepatan</p>
                        <div className="grid grid-cols-4 gap-1">
                          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => onChangePlaybackRate(rate)}
                              className={`py-1 rounded text-center transition-colors ${
                                playbackRate === rate ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-bg-hover'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {sources.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Kualitas</p>
                          <div className="space-y-0.5">
                            {sources.map((s, idx) => {
                              const quality = s.quality || 'Auto';
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    onSelectQuality(quality);
                                    setIsSettingsOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded transition-colors ${
                                    activeQuality === quality ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-bg-hover'
                                  }`}
                                >
                                  {quality}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={onToggleFullscreen}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
