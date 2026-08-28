import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Movie, StreamingData } from '@/types/movie';
import { movieService } from '@/services/movie.service';
import { movieStore } from '@/services/movieStore.service';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { ExclusiveTierGate } from '@/components/player/ExclusiveTierGate';
import { MovieComments } from '@/components/player/MovieComments';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNotification } from '@/contexts/NotificationContext';
import { watchPath } from '@/constants/routes';
import { formatDuration } from '@/utils/format';
import { getTierBadgeConfig } from '@/utils/tier';
import { IconCrown, IconStar, IconDiamond, IconCheck } from '@/components/icons';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StreamingData | null>(null);
  const [movieInfo, setMovieInfo] = useState<Movie | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Movie[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const { hasAccessToTier } = useAuth();
  const { isSubscribed, toggleSubscribe } = useNotification();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { success, info } = useToast();

  const [subscribersCount, setSubscribersCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sn_channel_subs');
      if (stored !== null) return Number(stored);
    } catch {
      // ignore
    }
    return 0;
  });

  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Rating dihitung murni dari rasio Like dan Dislike (Skala 0.0 - 10.0)
  const totalVotes = likesCount + dislikesCount;
  const dynamicRating = totalVotes === 0 ? 0 : Number(((likesCount / totalVotes) * 10).toFixed(1));

  const loadData = async () => {
    if (!id) return;
    setStatus('loading');
    try {
      const [streamData, movieDetail] = await Promise.all([
        movieService.getStreamingData(id),
        movieService.getById(id),
      ]);
      setData(streamData);
      setMovieInfo(movieDetail);
      setRelatedVideos(movieStore.getAll().filter((m) => m.id !== id));

      // Load real persistent likes & dislikes per video
      const storedLikes = localStorage.getItem(`sn_likes_${id}`);
      const storedDislikes = localStorage.getItem(`sn_dislikes_${id}`);
      const userLiked = localStorage.getItem(`sn_user_liked_${id}`) === 'true';
      const userDisliked = localStorage.getItem(`sn_user_disliked_${id}`) === 'true';

      setLikesCount(storedLikes !== null ? Number(storedLikes) : 0);
      setDislikesCount(storedDislikes !== null ? Number(storedDislikes) : 0);
      setIsLiked(userLiked);
      setIsDisliked(userDisliked);

      setStatus('success');
      document.title = `${streamData.title} — Official Sekolah Nakal`;
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);

    const handleDurationDetected = (e: Event) => {
      const custom = e as CustomEvent<{ movieId: string; duration: number }>;
      if (custom.detail && custom.detail.movieId === id && custom.detail.duration > 0) {
        setMovieInfo((prev) => (prev ? { ...prev, duration: custom.detail.duration } : prev));
      }
    };
    window.addEventListener('sekolah_nakal_video_duration_detected', handleDurationDetected);
    return () => window.removeEventListener('sekolah_nakal_video_duration_detected', handleDurationDetected);
  }, [id]);

  const handleLike = () => {
    if (!id) return;
    if (isLiked) {
      setIsLiked(false);
      const updatedLikes = Math.max(0, likesCount - 1);
      setLikesCount(updatedLikes);
      localStorage.setItem(`sn_likes_${id}`, String(updatedLikes));
      localStorage.removeItem(`sn_user_liked_${id}`);
    } else {
      setIsLiked(true);
      const updatedLikes = likesCount + 1;
      setLikesCount(updatedLikes);
      localStorage.setItem(`sn_likes_${id}`, String(updatedLikes));
      localStorage.setItem(`sn_user_liked_${id}`, 'true');

      if (isDisliked) {
        setIsDisliked(false);
        const updatedDislikes = Math.max(0, dislikesCount - 1);
        setDislikesCount(updatedDislikes);
        localStorage.setItem(`sn_dislikes_${id}`, String(updatedDislikes));
        localStorage.removeItem(`sn_user_disliked_${id}`);
      }
      success('Terima kasih atas penilaian positif Anda!');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sekolah_nakal_ratings_updated', { detail: { movieId: id } }));
    }
  };

  const handleDislike = () => {
    if (!id) return;
    if (isDisliked) {
      setIsDisliked(false);
      const updatedDislikes = Math.max(0, dislikesCount - 1);
      setDislikesCount(updatedDislikes);
      localStorage.setItem(`sn_dislikes_${id}`, String(updatedDislikes));
      localStorage.removeItem(`sn_user_disliked_${id}`);
    } else {
      setIsDisliked(true);
      const updatedDislikes = dislikesCount + 1;
      setDislikesCount(updatedDislikes);
      localStorage.setItem(`sn_dislikes_${id}`, String(updatedDislikes));
      localStorage.setItem(`sn_user_disliked_${id}`, 'true');

      if (isLiked) {
        setIsLiked(false);
        const updatedLikes = Math.max(0, likesCount - 1);
        setLikesCount(updatedLikes);
        localStorage.setItem(`sn_likes_${id}`, String(updatedLikes));
        localStorage.removeItem(`sn_user_liked_${id}`);
      }
      info('Tanggapan Anda telah dicatat.');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sekolah_nakal_ratings_updated', { detail: { movieId: id } }));
    }
  };

  const handleToggleSubscribe = () => {
    toggleSubscribe();
    if (!isSubscribed) {
      const updated = subscribersCount + 1;
      setSubscribersCount(updated);
      try {
        localStorage.setItem('sn_channel_subs', String(updated));
      } catch {}
      success('Berhasil subscribe! Anda akan menerima notifikasi setiap ada video baru.');
    } else {
      const updated = Math.max(0, subscribersCount - 1);
      setSubscribersCount(updated);
      try {
        localStorage.setItem('sn_channel_subs', String(updated));
      } catch {}
      info('Berhenti berlangganan saluran.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 pb-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8 animate-pulse">
            {/* Left Column: Video Player, Title, Channel, Description Skeletons */}
            <div className="space-y-4">
              {/* 16:9 Video Player Box Skeleton */}
              <div className="relative aspect-video w-full rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden flex items-center justify-center shadow-lg">
                <div className="h-14 w-14 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center pl-1 shadow-inner">
                  <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-zinc-600" />
                </div>
              </div>

              {/* Title & Badge Skeletons */}
              <div className="space-y-2 pt-1">
                <div className="h-7 w-3/4 bg-zinc-850 rounded-lg" />
                <div className="h-4 w-1/4 bg-zinc-900 rounded-md" />
              </div>

              {/* Channel & Actions Row Skeleton */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-850 border border-zinc-800 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-zinc-850 rounded" />
                    <div className="h-3 w-24 bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-28 bg-zinc-850 rounded-xl" />
                  <div className="h-9 w-20 bg-zinc-850 rounded-xl" />
                  <div className="h-9 w-24 bg-zinc-850 rounded-xl" />
                </div>
              </div>

              {/* Description Box Skeleton */}
              <div className="rounded-2xl bg-[#141414] border border-border/40 p-4 space-y-2.5">
                <div className="h-3.5 w-full bg-zinc-850 rounded" />
                <div className="h-3.5 w-5/6 bg-zinc-850 rounded" />
                <div className="h-3.5 w-2/3 bg-zinc-900 rounded" />
              </div>

              {/* Comments Section Skeleton */}
              <div className="pt-6 space-y-4">
                <div className="h-5 w-32 bg-zinc-850 rounded" />
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-zinc-850 shrink-0" />
                  <div className="flex-1 h-20 bg-[#141414] border border-zinc-800/80 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Right Column: Related Videos Skeleton Cards (YouTube Style) */}
            <div className="space-y-3">
              <div className="h-4 w-28 bg-zinc-850 rounded mb-4" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative aspect-video w-36 sm:w-40 shrink-0 rounded-xl bg-zinc-850 border border-zinc-800/80 overflow-hidden" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 w-full bg-zinc-850 rounded" />
                    <div className="h-3 w-3/4 bg-zinc-900 rounded" />
                    <div className="h-2.5 w-1/2 bg-zinc-900 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !data || !id) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary p-4">
        <ErrorState message="Gagal memuat video streaming." onRetry={loadData} />
      </div>
    );
  }

  const inWatchlist = movieInfo ? isInWatchlist(movieInfo.id) : false;
  const isLockedByTier = movieInfo?.tier && !hasAccessToTier(movieInfo.tier);
  const tierConfig = movieInfo?.tier ? getTierBadgeConfig(movieInfo.tier) : null;

  return (
    <div className="min-h-screen bg-bg-primary pt-20 pb-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Main 2-Column YouTube Style Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
          {/* Left Column: Player, Video Details, Channel Info, Description, Comments */}
          <div className="space-y-4">
            {/* 16:9 Video Player OR Locked Exclusive Tier Gate */}
            {isLockedByTier && movieInfo?.tier ? (
              <ExclusiveTierGate requiredTier={movieInfo.tier} onUnlocked={loadData} />
            ) : (
              <VideoPlayer movieId={id} streamingData={data} />
            )}

            {/* Video Title & Tier Badge */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data.title}
              </h1>
              {tierConfig && tierConfig.label !== 'REGULAR' && (
                <span className={`inline-flex items-center gap-1 ${tierConfig.badgeClass}`}>
                  {tierConfig.iconType === 'crown' && <IconCrown className="w-3.5 h-3.5" />}
                  {tierConfig.iconType === 'star' && <IconStar className="w-3.5 h-3.5" />}
                  {tierConfig.iconType === 'diamond' && <IconDiamond className="w-3.5 h-3.5" />}
                  <span>{tierConfig.label}</span>
                </span>
              )}
            </div>

            {/* Channel Info & Action Buttons Row (Divider at Bottom) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/30">
              {/* Uploader Channel Profile */}
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 rounded-full bg-black border border-brand/50 p-1 shadow-md flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Official Sekolah Nakal"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">
                      Official Sekolah Nakal
                    </span>
                    <span
                      title="Channel Resmi Terverifikasi"
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white"
                    >
                      ✓
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{subscribersCount.toLocaleString()} Subscriber · Saluran Resmi</p>
                </div>

                <button
                  onClick={handleToggleSubscribe}
                  className={`ml-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSubscribed
                      ? 'bg-bg-hover text-text-secondary hover:bg-bg-primary border border-border/60'
                      : 'bg-brand hover:bg-brand-hover text-white shadow-sm'
                  }`}
                >
                  {isSubscribed ? 'Disubscribe' : 'Subscribe'}
                </button>
              </div>

              {/* Action Buttons (Like, Dislike, Watchlist) */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Like / Dislike Pill */}
                <div className="flex items-center rounded-lg bg-bg-surface border border-border/60 p-0.5">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-bg-hover ${
                      isLiked ? 'text-brand font-bold' : 'text-text-secondary'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>{likesCount.toLocaleString()}</span>
                  </button>
                  <div className="h-4 w-px bg-border/60" />
                  <button
                    onClick={handleDislike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-bg-hover ${
                      isDisliked ? 'text-brand font-bold' : 'text-text-secondary'
                    }`}
                    title="Tidak Suka"
                  >
                    <svg className="w-4 h-4" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                    </svg>
                    <span>{dislikesCount.toLocaleString()}</span>
                  </button>
                </div>

                {/* Watchlist Bookmark */}
                <button
                  onClick={() => {
                    if (movieInfo) toggleWatchlist(movieInfo);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    inWatchlist
                      ? 'bg-brand/15 text-brand border-brand/40 shadow-sm'
                      : 'bg-bg-surface text-text-secondary border-border/60 hover:bg-bg-hover hover:text-white'
                  }`}
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{inWatchlist ? 'Tersimpan' : 'Simpan'}</span>
                </button>
              </div>
            </div>

            {/* Seamless Expandable Description Section */}
            <div className="py-3 border-y border-white/5 text-sm space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-text-muted">
                <span>{movieInfo?.year || 2024}</span>
                <span>•</span>
                <span>{formatDuration(movieInfo?.duration || 120)}</span>
                <span>•</span>
                <span className="text-yellow-400">★ {dynamicRating.toFixed(1)}</span>
                <div className="flex gap-1.5">
                  {(movieInfo?.genres || []).map((g) => (
                    <Badge key={g} variant="default">{g}</Badge>
                  ))}
                </div>
              </div>

              <p
                className={`text-zinc-300 text-xs sm:text-sm leading-relaxed transition-all ${
                  isDescExpanded ? 'line-clamp-none' : 'line-clamp-2'
                }`}
              >
                {movieInfo?.overview || data.title}
              </p>

              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-xs font-bold text-white hover:text-brand transition-colors pt-0.5 cursor-pointer"
              >
                {isDescExpanded ? 'Tampilkan lebih sedikit' : '...selengkapnya'}
              </button>
            </div>

            {/* Comments Discussion Section (Seamless with line dividers) */}
            <MovieComments movieId={id} movieTitle={data.title} />
          </div>

          {/* Right Column: Recommended Videos Seamless List with Divider Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <h2 className="text-base font-bold text-white tracking-tight">Video Terkait</h2>
              <span className="text-xs text-text-muted">{(relatedVideos || []).length} Video</span>
            </div>

            {(relatedVideos || []).length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-bg-surface/30 border border-border/30 text-xs text-zinc-400 space-y-1">
                <p className="font-bold text-white">Belum Ada Rekomendasi Video Terkait</p>
                <p className="text-[11px] text-text-muted">Jelajahi koleksi video lainnya di menu Pencarian.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(relatedVideos || []).map((video) => {
                  const vidTierConfig = video.tier ? getTierBadgeConfig(video.tier) : null;
                  return (
                    <Link
                      key={video.id}
                      to={watchPath(video.id)}
                      className="group flex gap-3 p-1.5 rounded-xl hover:bg-bg-hover/60 transition-colors border-b border-border/20 last:border-b-0 pb-3"
                    >
                      {/* 16:9 Thumbnail */}
                      <div className="relative aspect-video w-36 sm:w-40 shrink-0 overflow-hidden rounded-lg bg-bg-surface border border-border/40">
                        <img
                          src={video.backdropUrl || video.posterUrl}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {formatDuration(video.duration)}
                        </span>
                        {vidTierConfig && vidTierConfig.label !== 'REGULAR' && (
                          <span
                            className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase shadow ${vidTierConfig.badgeClass}`}
                          >
                            {vidTierConfig.shortLabel}
                          </span>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-col justify-start gap-1 min-w-0 pr-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-[11px] text-text-muted">Official Sekolah Nakal</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                          {(() => {
                            const sLikes = Number(localStorage.getItem(`sn_likes_${video.id}`)) || 0;
                            const sDislikes = Number(localStorage.getItem(`sn_dislikes_${video.id}`)) || 0;
                            const tVotes = sLikes + sDislikes;
                            const rRating = tVotes > 0 ? ((sLikes / tVotes) * 10).toFixed(1) : null;
                            return rRating ? (
                              <>
                                <span className="text-yellow-400 font-bold">★ {rRating}</span>
                                <span>•</span>
                              </>
                            ) : null;
                          })()}
                          <span>{video.year}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
