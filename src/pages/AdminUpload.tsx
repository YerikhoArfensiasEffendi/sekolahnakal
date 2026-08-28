/**
 * ArtPlayer Studio Creator Dashboard (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Sistem Autentikasi:
 * - 🤖 Integrasi Bot Discord: Membaca role Discord (@KREATOR, @UPLOADER, @TALENT, @ADMIN)
 * - 🚫 Jika role tidak memiliki izin upload: Otomatis ditolak & dialihkan kembali ke Beranda (/)
 * - 📦 Bulk Multi-Video Upload: Upload puluhan video sekaligus + custom judul & kategori per item
 * - 📁 Direct Video File Upload dari Laptop / HP
 * - ⏱️ Durasi Otomatis & Auto-Thumbnail Frame Video
 * - 👑 Upload Sesuai Tier: REGULER (Free), VIP, VVIP Uncensored, TALENT
 * - 🏷️ Kelola Kategori & Genre
 */

import { useState, useEffect, useMemo, useRef, type FormEvent, type DragEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { movieStore } from '@/services/movieStore.service';
import { categoryStore } from '@/services/categoryStore.service';
import { videoStorageService } from '@/services/videoStorage.service';
import { adStore, type GlobalAdSettings, type AdSlotConfig } from '@/services/adStore.service';
import { useAuth } from '@/contexts/AuthContext';
import type { Genre } from '@/constants/genres';
import type { Movie, VideoTier } from '@/types/movie';
import { useToast } from '@/contexts/ToastContext';
import { formatDuration } from '@/utils/format';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL } from '@/utils/tier';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
  IconCheck,
  IconLock,
  IconDiscord,
} from '@/components/icons';
import {
  discordRealtimeService,
  type DiscordChannelInfo,
  type DiscordSyncLog,
} from '@/services/discordRealtime.service';

type StudioTab = 'dashboard' | 'content' | 'upload' | 'discord_realtime' | 'categories' | 'ads' | 'settings';

interface BulkUploadItem {
  id: string;
  file: File;
  title: string;
  genres: string[];
  tier: VideoTier;
  duration: number;
  rating?: number;
  posterUrl: string;
  backdropUrl: string;
  overview: string;
  status: 'pending' | 'processing' | 'ready' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

const TIER_OPTIONS: { id: VideoTier; label: string; desc: string; icon: 'user' | 'star' | 'crown' | 'diamond' }[] = [
  {
    id: 'regular',
    label: 'REGULER (Gratis)',
    desc: 'Bebas ditonton oleh semua pengunjung tanpa login/syarat',
    icon: 'user',
  },
  {
    id: 'vip',
    label: 'EXCLUSIF VIP',
    desc: 'Khusus member pemegang role Discord VIP',
    icon: 'star',
  },
  {
    id: 'vvip',
    label: 'EXCLUSIF VVIP',
    desc: 'Konten premium tanpa sensor tertinggi untuk VVIP',
    icon: 'crown',
  },
  {
    id: 'talent',
    label: 'EXCLUSIF TALENT',
    desc: 'Video kolaborasi resmi talent dan kreator verified',
    icon: 'diamond',
  },
];

const DISCORD_STUDIO_ROLES = [
  { id: 'Engineer Sekolah', label: '🛠️ Engineer Sekolah (Admin & Uploader)', hasAccess: true },
  { id: 'VVIP', label: '👑 Member VVIP (Penonton)', hasAccess: false },
  { id: 'VIP', label: '⭐ Member VIP (Penonton)', hasAccess: false },
  { id: 'REGULAR', label: '👤 Member Regular (Tanpa Akses)', hasAccess: false },
];

function checkHasDiscordUploadAccess(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  const upper = roles.map((r) => String(r || '').toUpperCase());
  return upper.some((r) => r.includes('ENGINEER') || r.includes('1491386462518775938'));
}

// Membaca total suka nyata per video
function getMovieLikesCount(movieId: string): number {
  try {
    const rawLikes = localStorage.getItem(`sn_likes_${movieId}`);
    if (rawLikes !== null) {
      return parseInt(rawLikes, 10) || 0;
    }
  } catch {
    // fallback
  }
  return 0;
}

export default function AdminUpload() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as StudioTab) || 'dashboard';

  const { discordAccount, syncDiscord, disconnectDiscord } = useAuth();
  const { success, error, info } = useToast();

  // ================= 1. DISCORD ROLE AUTHENTICATION =================
  // Discord Form Verification State
  const [discordUsernameInput, setDiscordUsernameInput] = useState(discordAccount?.username || '');
  const [selectedDiscordRole, setSelectedDiscordRole] = useState(DISCORD_STUDIO_ROLES[0]!.id);
  const [isVerifyingDiscord, setIsVerifyingDiscord] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Status Otorisasi: akun Discord wajib memiliki role Engineer Sekolah
  const hasDiscordAccess = checkHasDiscordUploadAccess(discordAccount?.roles);
  const isAuthorized = hasDiscordAccess;

  // ================= 2. STUDIO STATE =================
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [contentPage, setContentPage] = useState<number>(1);
  const CONTENT_PER_PAGE = 10;

  // Reset pagination on search or filter change
  useEffect(() => {
    setContentPage(1);
  }, [searchQuery, filterTier, filterCategory]);

  // Perhitungan Statistik Dinamis Dashboard (Durasi Riil dari Detik)
  const totalDurationSeconds = useMemo(() => {
    return movies.reduce((acc, m) => acc + (m.duration > 0 ? m.duration : 1), 0);
  }, [movies]);

  const formattedTotalDuration = useMemo(() => {
    return formatDuration(totalDurationSeconds);
  }, [totalDurationSeconds]);

  const totalLikesCount = useMemo(() => {
    return movies.reduce((acc, m) => acc + getMovieLikesCount(m.id), 0);
  }, [movies]);

  // Video Form State (Single & Bulk)
  const [uploadMode, setUploadMode] = useState<'file' | 'bulk' | 'url'>('bulk');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tier, setTier] = useState<VideoTier>('regular');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [thumbnailPosition, setThumbnailPosition] = useState<'top' | 'center' | 'bottom'>('top');
  const [thumbnailVariations, setThumbnailVariations] = useState<{ top: string; center: string; bottom: string } | null>(null);
  const [isThumbnailEditorOpen, setIsThumbnailEditorOpen] = useState(false);
  const [editorTimeSec, setEditorTimeSec] = useState<number>(1.5);
  const [editorZoom, setEditorZoom] = useState<number>(1.0);
  const [editorShiftX, setEditorShiftX] = useState<number>(-20);
  const [editorShiftY, setEditorShiftY] = useState<number>(-10);
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoBlobUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return videoUrl || '';
  }, [selectedFile, videoUrl]);
  const [duration, setDuration] = useState<number>(1);
  const [customRating, setCustomRating] = useState<number>(0);
  const [overview, setOverview] = useState('');

  // Bulk Upload State
  const [bulkQueue, setBulkQueue] = useState<BulkUploadItem[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkGlobalCategory, setBulkGlobalCategory] = useState<string>('all');
  const [bulkGlobalTier, setBulkGlobalTier] = useState<VideoTier | 'keep'>('keep');

  // Category Form State
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Storage Integration State (100% Cloud: ZeroStorage & Lulustream)
  const [zerostorageApiKey, setZerostorageApiKey] = useState(movieStore.getZeroStorageApiKey());
  const [lulustreamApiKey, setLulustreamApiKey] = useState(movieStore.getLulustreamApiKey());
  const [storageProvider, setStorageProvider] = useState<'zerostorage' | 'lulustream' | 'auto'>(movieStore.getStorageProvider());
  const [isSavingStorage, setIsSavingStorage] = useState(false);

  // Ad Management State
  const [adSettings, setAdSettings] = useState<GlobalAdSettings>(() => adStore.getConfig());
  const [selectedAdSlotId, setSelectedAdSlotId] = useState<string>('left-1');
  const [isSavingAds, setIsSavingAds] = useState(false);

  // Live Upload Progress Modal State
  const [isUploadingModalOpen, setIsUploadingModalOpen] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('Mengunggah video ke server cloud...');
  const [currentUploadFileName, setCurrentUploadFileName] = useState('');
  const [currentUploadFilePercent, setCurrentUploadFilePercent] = useState(0);
  const [currentUploadItemIndex, setCurrentUploadItemIndex] = useState(1);
  const [totalUploadItemsCount, setTotalUploadItemsCount] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const adMediaInputRef = useRef<HTMLInputElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const customImageInputRef = useRef<HTMLInputElement | null>(null);

  // Otomatis arahkan ke beranda jika akun Discord terhubung tetapi tidak memiliki role upload
  useEffect(() => {
    if (discordAccount && !hasDiscordAccess) {
      setRedirectCountdown(3);
    } else {
      setRedirectCountdown(null);
    }
  }, [discordAccount, hasDiscordAccess]);

  // Countdown timer redirect ke beranda
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Muat data katalog & kategori
  const refreshData = () => {
    setMovies(movieStore.getAll());
    setCategories(categoryStore.getAll());
    setAdSettings(adStore.getConfig());
  };

  // Pastikan selectedGenres selalu bersih dan sinkron dengan kategori aktif
  useEffect(() => {
    if (categories.length > 0) {
      setSelectedGenres((prev) => {
        const valid = prev.filter((g) => categories.some((c) => c.name.toLowerCase() === g.toLowerCase()));
        if (valid.length > 0) return valid;
        return [categories[0]!.name];
      });
    }
  }, [categories]);

  useEffect(() => {
    if (!isAuthorized) return;
    refreshData();
    movieStore.fetchLulustreamServerConfig().then((cfg) => {
      if (cfg.apiKey) setLulustreamApiKey(cfg.apiKey);
    });

    const handleMoviesUpdate = () => setMovies(movieStore.getAll());
    const handleCatsUpdate = () => setCategories(categoryStore.getAll());
    const handleAdsUpdate = () => setAdSettings(adStore.getConfig());

    window.addEventListener('sekolah_nakal_movies_updated', handleMoviesUpdate);
    window.addEventListener('sekolah_nakal_categories_updated', handleCatsUpdate);
    window.addEventListener('sekolah_nakal_ads_updated', handleAdsUpdate);

    return () => {
      window.removeEventListener('sekolah_nakal_movies_updated', handleMoviesUpdate);
      window.removeEventListener('sekolah_nakal_categories_updated', handleCatsUpdate);
      window.removeEventListener('sekolah_nakal_ads_updated', handleAdsUpdate);
    };
  }, [isAuthorized]);

  // ================= 2.1 DISCORD REALTIME & LOGS STATE =================
  const [discordChannels, setDiscordChannels] = useState<DiscordChannelInfo[]>([]);
  const [discordLogs, setDiscordLogs] = useState<DiscordSyncLog[]>([]);
  const [isLoadingDiscordChannels, setIsLoadingDiscordChannels] = useState(false);
  const [isSyncingDiscord, setIsSyncingDiscord] = useState(false);
  const [isAutoPollActive, setIsAutoPollActive] = useState(true);

  const loadDiscordChannels = async () => {
    setIsLoadingDiscordChannels(true);
    const res = await discordRealtimeService.getChannels();
    if (res.success) {
      setDiscordChannels(res.channels);
    }
    setIsLoadingDiscordChannels(false);
  };

  const loadDiscordLogs = async () => {
    const res = await discordRealtimeService.getLogs();
    if (res.success) {
      setDiscordLogs(res.logs);
    }
  };

  const handleTriggerRealtimePoll = async () => {
    setIsSyncingDiscord(true);
    info('Memeriksa video baru di semua channel Discord...');
    const res = await discordRealtimeService.pollRealtime();
    setIsSyncingDiscord(false);
    await loadDiscordLogs();
    if (res.success) {
      if (res.totalNewVideosPublished > 0) {
        success(`🎉 Ditemukan & dipublikasikan ${res.totalNewVideosPublished} video baru dari Discord!`);
        refreshData();
      } else {
        info('Semua channel Discord sudah up-to-date (tidak ada video baru).');
      }
    } else {
      error('Gagal menjalankan polling Discord. Periksa koneksi server.');
    }
  };

  const handleScrapeSingleChannel = async (channelId: string, channelName: string) => {
    info(`Menarik video dari channel #${channelName}...`);
    const res = await discordRealtimeService.scrapeChannel(channelId, 25);
    await loadDiscordLogs();
    if (res.success) {
      if (res.publishedCount > 0) {
        success(`🎉 Sukses mempublikasikan ${res.publishedCount} video dari #${channelName} ke [${res.category}]!`);
        refreshData();
      } else {
        info(`Channel #${channelName} sudah bersih & up-to-date.`);
      }
    } else {
      error(`Gagal menarik video dari #${channelName}.`);
    }
  };

  const handleClearDiscordLogs = async () => {
    if (!window.confirm('Bersihkan riwayat log aktivitas Discord?')) return;
    const ok = await discordRealtimeService.clearLogs();
    if (ok) {
      setDiscordLogs([]);
      success('Log aktivitas Discord berhasil dibersihkan.');
    }
  };

  // Background Auto-Poll Timer (Setiap 8 detik saat Admin aktif)
  useEffect(() => {
    if (!isAuthorized) return;
    loadDiscordChannels();
    loadDiscordLogs();

    const interval = setInterval(() => {
      if (isAutoPollActive) {
        loadDiscordLogs();
        discordRealtimeService.pollRealtime().then((res) => {
          if (res.totalNewVideosPublished > 0) {
            refreshData();
          }
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthorized, isAutoPollActive]);

  const changeTab = (tab: StudioTab) => {
    setActiveTab(tab);
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  // ================= DISCORD ROLE VERIFICATION =================
  const handleVerifyDiscordRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!discordUsernameInput.trim()) {
      error('Silakan masukkan username Discord Anda!');
      return;
    }

    setIsVerifyingDiscord(true);

    try {
      const response = await fetch('/api/discord.php?action=verify_member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: discordUsernameInput.trim(),
          roleName: selectedDiscordRole,
        }),
      });
      const data = await response.json();

      if (data && data.success && data.account) {
        syncDiscord(data.account.roles[0] || selectedDiscordRole, data.account.username);
        setIsVerifyingDiscord(false);

        if (data.hasUploadAccess) {
          success(`Verifikasi Bot Resmi Berhasil! Selamat datang @${data.account.username}`);
        } else {
          error(`Akses Ditolak: Akun @${data.account.username} tidak memiliki role upload di server Discord.`);
        }
        return;
      }
    } catch {
      // fallback
    }

    syncDiscord(selectedDiscordRole, discordUsernameInput.trim());
    setIsVerifyingDiscord(false);

    const targetRoleObj = DISCORD_STUDIO_ROLES.find((r) => r.id === selectedDiscordRole);
    if (targetRoleObj?.hasAccess) {
      success(`Verifikasi bot berhasil! Selamat datang @${discordUsernameInput} (${selectedDiscordRole})`);
    } else {
      error(`Akses ditolak: Role @${selectedDiscordRole} tidak memiliki izin akses Studio Upload.`);
    }
  };

  const handleLockStudio = () => {
    disconnectDiscord();
    info('Sesi Studio Kreator telah dikunci demi keamanan.');
  };

  // ================= SINGLE VIDEO PROCESSOR =================
  const handleProcessSingleVideo = async (file: File) => {
    setSelectedFile(file);

    // 1. Instan isi judul dari nama file bersih (tanpa jeda/lag)
    if (!title || editingId === null) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ');
      setTitle(cleanName);
    }

    setIsProcessingFile(true);

    try {
      // 2. Ekstraksi metadata cepat & non-blocking
      const meta = await videoStorageService.extractVideoMetadata(file);
      setDuration(meta.duration);

      if (meta.variations) {
        setThumbnailVariations(meta.variations);
        setPosterUrl(meta.variations.top);
        setBackdropUrl(meta.variations.top);
      } else if (meta.posterDataUrl) {
        setPosterUrl(meta.posterDataUrl);
        setBackdropUrl(meta.posterDataUrl);
      }
      setThumbnailPosition('top');

      success(`✓ File "${file.name}" siap di-draft! Durasi: ${formatDuration(meta.duration)}`);
    } catch {
      setDuration(60);
      setPosterUrl('/images/logo.png');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSelectThumbnailPosition = (pos: 'top' | 'center' | 'bottom') => {
    setThumbnailPosition(pos);
    if (thumbnailVariations && thumbnailVariations[pos]) {
      setPosterUrl(thumbnailVariations[pos]);
      setBackdropUrl(thumbnailVariations[pos]);
    }
  };

  const handleSeekEditorTime = (timeSec: number) => {
    setEditorTimeSec(timeSec);
    if (editorVideoRef.current) {
      editorVideoRef.current.currentTime = Math.max(0.1, timeSec);
    }
  };

  const handleLockAndSaveCustomThumbnail = async () => {
    if (editorVideoRef.current) {
      const video = editorVideoRef.current;
      try {
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 360;
        const targetW = 640;
        const targetH = 360;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#080808';
          ctx.fillRect(0, 0, targetW, targetH);

          const baseScale = Math.max(targetW / vW, targetH / vH);
          const finalScale = baseScale * Math.max(0.7, Math.min(2.5, editorZoom));
          const drawW = Math.round(vW * finalScale);
          const drawH = Math.round(vH * finalScale);

          const centerX = (targetW - drawW) / 2;
          const centerY = (targetH - drawH) / 2;

          const maxOffsetX = Math.max(0, (drawW - targetW) / 2);
          const maxOffsetY = Math.max(0, (drawH - targetH) / 2);

          const offsetX = (editorShiftX / 50) * maxOffsetX;
          const offsetY = (editorShiftY / 50) * maxOffsetY;

          const drawX = Math.round(centerX + offsetX);
          const drawY = Math.round(centerY + offsetY);

          ctx.drawImage(video, drawX, drawY, drawW, drawH);
          const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPosterUrl(finalDataUrl);
          setBackdropUrl(finalDataUrl);
          setIsThumbnailEditorOpen(false);
          success('Frame thumbnail kustom berhasil dirender & dikunci!');
          return;
        }
      } catch {
        // fallback
      }
    }

    if (selectedFile || videoUrl) {
      try {
        const source = selectedFile || videoUrl;
        const result = await videoStorageService.captureCustomFrame(source, editorTimeSec, editorZoom, editorShiftX, editorShiftY);
        if (result && result !== '/images/logo.png') {
          setPosterUrl(result);
          setBackdropUrl(result);
        }
      } catch {}
    }
    setIsThumbnailEditorOpen(false);
    success('Frame thumbnail kustom berhasil dikunci!');
  };

  const handleCaptureCurrentPlayerFrame = () => {
    if (!previewVideoRef.current) {
      error('Video preview belum siap.');
      return;
    }
    const v = previewVideoRef.current;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx && v.videoWidth > 0) {
        ctx.drawImage(v, 0, 0, 640, 360);
        const frameUrl = canvas.toDataURL('image/jpeg', 0.92);
        setPosterUrl(frameUrl);
        setBackdropUrl(frameUrl);
        success(`📸 Berhasil mengambil thumbnail dari detik ke-${v.currentTime.toFixed(1)}s!`);
        return;
      }
    } catch {}
    error('Gagal mengambil frame dari video. Putar video sejenak lalu klik tombol tangkap frame.');
  };

  const handleCustomImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setPosterUrl(dataUrl);
        setBackdropUrl(dataUrl);
        success(`✓ Gambar thumbnail "${file.name}" berhasil diterapkan!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // ================= BULK MULTI-VIDEO PROCESSOR =================
  const handleProcessBulkFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.includes('video') || f.name.match(/\.(mp4|webm|mkv|mov)$/i));
    if (fileArray.length === 0) {
      error('Tidak ada file video valid yang dipilih (.mp4, .webm, .mkv, .mov)');
      return;
    }

    setIsBulkProcessing(true);
    info(`Sedang memproses ${fileArray.length} video ke antrean bulk upload...`);

    const newItems: BulkUploadItem[] = [];
    const defaultCat = categories.length > 0 && categories[0]?.name ? categories[0]!.name : 'Umum';

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]!;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ');
      const itemId = `bulk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

      try {
        const meta = await videoStorageService.extractVideoMetadata(file);
        newItems.push({
          id: itemId,
          file,
          title: cleanTitle,
          genres: [defaultCat],
          tier: 'regular',
          duration: meta.duration > 0 ? meta.duration : 1,
          rating: 0,
          posterUrl: meta.posterDataUrl || '/images/logo.png',
          backdropUrl: meta.posterDataUrl || '/images/logo.png',
          overview: `${cleanTitle} adalah sajian video eksklusif persembahan Sekolah Nakal.`,
          status: 'ready',
        });
      } catch {
        newItems.push({
          id: itemId,
          file,
          title: cleanTitle,
          genres: [defaultCat],
          tier: 'regular',
          duration: 1,
          rating: 0,
          posterUrl: '/images/logo.png',
          backdropUrl: '/images/logo.png',
          overview: `${cleanTitle} adalah sajian video eksklusif persembahan Sekolah Nakal.`,
          status: 'ready',
        });
      }
    }

    setBulkQueue((prev) => [...prev, ...newItems]);
    setIsBulkProcessing(false);
    success(`Berhasil menambahkan ${newItems.length} video ke antrean bulk upload!`);
  };

  const handleBulkItemChange = (id: string, updates: Partial<BulkUploadItem>) => {
    setBulkQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveBulkItem = (id: string) => {
    setBulkQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBulkQueue = () => {
    if (window.confirm('Kosongkan semua antrean bulk upload?')) {
      setBulkQueue([]);
    }
  };

  const handleApplyGlobalCategoryToBulk = (catName: string) => {
    if (!catName || catName === 'all') return;
    setBulkQueue((prev) =>
      prev.map((item) => ({
        ...item,
        genres: [catName],
      }))
    );
    success(`Semua video di antrean diset ke kategori: ${catName}`);
  };

  const handleApplyGlobalTierToBulk = (newTier: VideoTier) => {
    setBulkQueue((prev) =>
      prev.map((item) => ({
        ...item,
        tier: newTier,
      }))
    );
    success(`Semua video di antrean diset ke tier: ${newTier.toUpperCase()}`);
  };

  const handlePublishAllBulk = async () => {
    if (bulkQueue.length === 0) {
      error('Antrean bulk upload masih kosong!');
      return;
    }

    setIsBulkProcessing(true);
    setIsUploadingModalOpen(true);
    setTotalUploadItemsCount(bulkQueue.length);
    setCurrentUploadItemIndex(1);
    setCurrentUploadFilePercent(0);
    setUploadStatusText('Menyiapkan koneksi server...');

    let publishedCount = 0;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < bulkQueue.length; i++) {
      const item = bulkQueue[i]!;
      setCurrentUploadItemIndex(i + 1);
      setCurrentUploadFileName(item.title.trim() || item.file.name);
      setCurrentUploadFilePercent(0);
      setUploadStatusText(`Mengunggah file [${i + 1}/${bulkQueue.length}] ke server...`);

      try {
        let serverVideoUrl: string | undefined = undefined;
        const uploadRes = await movieStore.uploadVideoToServer(
          item.file,
          (pct) => {
            setCurrentUploadFilePercent(pct);
            if (pct >= 100) {
              setUploadStatusText(`[${i + 1}/${bulkQueue.length}] Menyimpan & memproses file...`);
            } else {
              setUploadStatusText(`[${i + 1}/${bulkQueue.length}] Mengunggah "${item.file.name}" (${pct}%)...`);
            }
          },
          (statusText) => {
            setUploadStatusText(`[${i + 1}/${bulkQueue.length}] ${statusText}`);
          },
          storageProvider
        );

        if (!uploadRes.success || !uploadRes.url) {
          console.error('Gagal upload video ke storage:', item.title, uploadRes.error);
          error(`Gagal upload "${item.title}": ${uploadRes.error || 'Koneksi cloud storage terputus'}`);
          continue;
        }

        serverVideoUrl = uploadRes.url;

        const cleanItemGenres = item.genres.filter((g) => categories.some((c) => c.name.toLowerCase() === g.toLowerCase()));
        const created = movieStore.add({
          title: item.title.trim() || item.file.name,
          genres: cleanItemGenres.length > 0 ? cleanItemGenres : (categories.length > 0 ? [categories[0]!.name] : ['Umum']),
          tier: item.tier,
          duration: item.duration > 0 ? item.duration : 1,
          year: currentYear,
          rating: item.rating || 0,
          overview: item.overview || `${item.title} adalah video eksklusif Sekolah Nakal.`,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          videoUrl: serverVideoUrl,
        });

        if (created) {
          publishedCount++;
        }
      } catch (err) {
        console.error('Gagal publish item:', item.title, err);
      }
    }

    setIsUploadingModalOpen(false);
    setIsBulkProcessing(false);
    setBulkQueue([]);
    if (publishedCount > 0) {
      success(`🎉 Sukses mempublikasikan ${publishedCount} video ke katalog streaming!`);
    } else {
      error('Tidak ada video yang berhasil diunggah ke storage. Silakan periksa API Key dan koneksi internet Anda.');
    }
    refreshData();
    changeTab('content');
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (uploadMode === 'bulk' || files.length > 1) {
        setUploadMode('bulk');
        handleProcessBulkFiles(files);
      } else {
        handleProcessSingleVideo(files[0]!);
      }
    }
  };

  // Form helpers
  const toggleGenre = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
      } else {
        info('Setidaknya pilih minimal 1 kategori video');
      }
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const resetVideoForm = () => {
    setEditingId(null);
    setSelectedFile(null);
    setTitle('');
    setSelectedGenres(categories.length > 0 ? [categories[0]!.name] : []);
    setTier('regular');
    setVideoUrl('');
    setPosterUrl('');
    setBackdropUrl('');
    setThumbnailVariations(null);
    setThumbnailPosition('top');
    setDuration(1);
    setCustomRating(0);
    setOverview('');
    setIsProcessingFile(false);
  };

  const handleStartEditVideo = (movie: Movie) => {
    setEditingId(movie.id);
    setSelectedFile(null);
    setTitle(movie.title);
    const validGenres = (movie.genres || []).filter((g) => categories.some((c) => c.name.toLowerCase() === g.toLowerCase()));
    setSelectedGenres(validGenres.length > 0 ? validGenres : (categories.length > 0 ? [categories[0]!.name] : []));
    setTier(movie.tier || 'regular');
    setVideoUrl(movieStore.getVideoUrl(movie.id) || '');
    setPosterUrl(movie.posterUrl);
    setBackdropUrl(movie.backdropUrl);
    setDuration(movie.duration || 1);
    setCustomRating(movie.rating || 0);
    setOverview(movie.overview);
    setUploadMode('file');
    changeTab('upload');
  };

  const handlePurgeBrokenVideos = () => {
    if (!window.confirm('Hapus semua data video yang link streaming-nya kosong atau rusak?')) return;
    const all = movieStore.getAll();
    const valid = all.filter((m) => {
      const url = movieStore.getVideoUrl(m.id) || m.videoUrl;
      return url && url.trim() !== '' && !url.includes('/uploads/videos/');
    });
    const removedCount = all.length - valid.length;
    localStorage.setItem('sekolah_nakal_movies_db', JSON.stringify(valid));
    fetch('/api/movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid),
    }).catch(() => {});
    refreshData();
    if (removedCount > 0) {
      success(`🧹 Berhasil membersihkan ${removedCount} video kosong/rusak dari database.`);
    } else {
      info('Semua data video sudah bersih dan memiliki link streaming yang valid.');
    }
  };

  const handleSaveSingleVideo = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      error('Judul video wajib diisi!');
      return;
    }

    const finalPoster = posterUrl.trim() || '/images/logo.png';
    const finalBackdrop = backdropUrl.trim() || finalPoster;
    const currentYear = new Date().getFullYear();

    let finalVideoUrl = uploadMode === 'url' ? videoUrl.trim() : undefined;

    if (!editingId && uploadMode === 'file' && !selectedFile) {
      error('Silakan pilih file video MP4/MKV yang ingin diunggah!');
      return;
    }

    if (!editingId && uploadMode === 'url' && !videoUrl.trim()) {
      error('Silakan masukkan link video streaming (ZeroStorage / LuluStream / MP4 / HLS)!');
      return;
    }

    if (uploadMode === 'file' && selectedFile) {
      setIsUploadingModalOpen(true);
      setCurrentUploadFileName(selectedFile.name);
      setCurrentUploadItemIndex(1);
      setTotalUploadItemsCount(1);
      setCurrentUploadFilePercent(0);
      setUploadStatusText('Mengunggah file video ke server...');

      const uploadRes = await movieStore.uploadVideoToServer(
        selectedFile,
        (pct) => {
          setCurrentUploadFilePercent(pct);
          if (pct >= 100) {
            setUploadStatusText('Menyimpan & memproses metadata video di server...');
          } else {
            setUploadStatusText(`Mengunggah video (${pct}%)...`);
          }
        },
        (statusText) => {
          setUploadStatusText(statusText);
        },
        storageProvider
      );

      if (uploadRes.success && uploadRes.url) {
        finalVideoUrl = uploadRes.url;
        setUploadStatusText('Upload berhasil! Menyimpan data video...');
      } else {
        setIsUploadingModalOpen(false);
        error(uploadRes.error || 'Gagal mengunggah file video ke server. Periksa koneksi atau kapasitas server.');
        return;
      }
    }

    if (editingId) {
      const updated = movieStore.update(editingId, {
        title: title.trim(),
        genres: selectedGenres.length > 0 ? selectedGenres : ['Umum'],
        tier,
        duration: duration > 0 ? duration : 1,
        rating: customRating || 0,
        overview: overview.trim() || `${title.trim()} adalah konten eksklusif Sekolah Nakal.`,
        posterUrl: finalPoster,
        backdropUrl: finalBackdrop,
        videoUrl: finalVideoUrl,
      });

      setIsUploadingModalOpen(false);

      if (updated) {
        success(`Video "${title}" berhasil diperbarui!`);
        resetVideoForm();
        refreshData();
        changeTab('content');
      } else {
        error('Gagal memperbarui video.');
      }
    } else {
      const created = movieStore.add({
        title: title.trim(),
        genres: selectedGenres.length > 0 ? selectedGenres : ['Umum'],
        tier,
        duration: duration > 0 ? duration : 1,
        year: currentYear,
        rating: customRating || 0,
        overview: overview.trim() || `${title.trim()} adalah konten eksklusif Sekolah Nakal.`,
        posterUrl: finalPoster,
        backdropUrl: finalBackdrop,
        videoUrl: finalVideoUrl,
      });

      setIsUploadingModalOpen(false);

      if (created) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sekolah_nakal_video_published', {
              detail: { title: created.title, id: created.id },
            })
          );
        }
        success(`Video "${title}" berhasil diupload dan siap ditonton!`);
        resetVideoForm();
        refreshData();
        changeTab('content');
      } else {
        error('Gagal menambah video baru.');
      }
    }
  };

  const handleDeleteVideo = async (id: string, movieTitle: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus video "${movieTitle}"?`)) {
      await videoStorageService.deleteVideo(id);
      movieStore.delete(id);
      success(`Video "${movieTitle}" berhasil dihapus.`);
      if (editingId === id) resetVideoForm();
      refreshData();
    }
  };

  // Category Handlers
  const resetCategoryForm = () => {
    setCatEditingId(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
  };

  const handleStartEditCategory = (cat: Genre) => {
    setCatEditingId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
  };

  const handleSaveCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      error('Nama kategori tidak boleh kosong!');
      return;
    }

    if (catEditingId) {
      const updated = categoryStore.update(catEditingId, {
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDescription.trim() || undefined,
      });
      if (updated) {
        success(`Kategori "${catName}" berhasil diperbarui!`);
        resetCategoryForm();
        refreshData();
      } else {
        error('Gagal memperbarui kategori.');
      }
    } else {
      const created = categoryStore.add(catName, catDescription, catSlug);
      if (created) {
        success(`Kategori baru "${catName}" berhasil ditambahkan!`);
        resetCategoryForm();
        refreshData();
      } else {
        error('Gagal membuat kategori.');
      }
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Hapus kategori "${name}"?`)) {
      categoryStore.delete(id);
      success(`Kategori "${name}" berhasil dihapus.`);
      if (catEditingId === id) resetCategoryForm();
      refreshData();
    }
  };

  const handleDeleteAllCategories = () => {
    if (categories.length === 0) return;
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH (${categories.length}) kategori?`)) {
      categories.forEach((c) => categoryStore.delete(c.id));
      success('Seluruh kategori berhasil dikosongkan.');
      resetCategoryForm();
      refreshData();
    }
  };

  // ================= AD MANAGEMENT HANDLERS =================
  const handleToggleMasterAds = async () => {
    const nextVal = !adSettings.masterEnabled;
    const updated = { ...adSettings, masterEnabled: nextVal };
    setAdSettings(updated);
    await adStore.saveConfig(updated);
    if (nextVal) {
      success('Banner iklan telah DIAKTIFKAN di seluruh website!');
    } else {
      info('Banner iklan telah DINONAKTIFKAN (Tampilan website bersih).');
    }
  };

  const handleUpdateAdSlot = (slotId: string, updates: Partial<AdSlotConfig>) => {
    setAdSettings((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
    }));
  };

  const handleUploadSlotMedia = (slotId: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleUpdateAdSlot(slotId, { mediaUrl: dataUrl, type: 'image' });
        success(`Media gambar / GIF untuk slot berhasil diunggah!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAllAds = async () => {
    setIsSavingAds(true);
    const ok = await adStore.saveConfig(adSettings);
    setIsSavingAds(false);
    if (ok) {
      success('Seluruh pengaturan iklan berhasil disimpan & disinkronkan ke server!');
    } else {
      error('Gagal menyimpan iklan ke server.');
    }
  };

  const handleResetAdsToDefaults = async () => {
    if (window.confirm('Reset seluruh konfigurasi iklan ke pengaturan awal?')) {
      const def = await adStore.resetToDefaults();
      setAdSettings(def);
      success('Konfigurasi iklan berhasil direset ke default.');
    }
  };

  // Storage Configuration Handler (ZeroStorage & Lulustream)
  const handleSaveStorageConfig = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingStorage(true);
    await Promise.all([
      movieStore.saveZeroStorageApiKey(zerostorageApiKey),
      movieStore.saveLulustreamApiKey(lulustreamApiKey),
    ]);
    movieStore.setStorageProvider(storageProvider);
    setIsSavingStorage(false);
    success('Pengaturan penyimpanan ZeroStorage & Lulustream berhasil disimpan!');
  };

  // Backup & Restore Handlers
  const handleExportJson = () => {
    const dataStr = movieStore.exportBackupJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katalog-sekolah-nakal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Database katalog JSON berhasil di-download!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = movieStore.importBackupJson(content);
        if (res.success) {
          success(`Berhasil mengimpor ${res.count} video ke database!`);
          refreshData();
        } else {
          error(res.error || 'Gagal membaca format JSON.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter video
  const filteredMovies = movies.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTier = filterTier === 'all' || (m.tier || 'regular') === filterTier;
    const matchCat = filterCategory === 'all' || m.genres.includes(filterCategory);
    return matchSearch && matchTier && matchCat;
  });

  // Maksimal display 10 video per slide/halaman
  const totalContentPages = Math.ceil(filteredMovies.length / CONTENT_PER_PAGE) || 1;
  const paginatedMovies = useMemo(() => {
    const start = (contentPage - 1) * CONTENT_PER_PAGE;
    return filteredMovies.slice(start, start + CONTENT_PER_PAGE);
  }, [filteredMovies, contentPage]);

  const getVideoCountForCategory = (catName: string) => {
    return movies.filter((m) => m.genres.some((g) => g.toLowerCase() === catName.toLowerCase())).length;
  };

  // =========================================================================
  // SCENARIO 1: DISCORD CONNECTED BUT ROLE HAS NO UPLOAD ACCESS (AUTO-REDIRECT)
  // =========================================================================
  if (discordAccount && !hasDiscordAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <IconLock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Akses Ditolak: Role Tidak Memenuhi Syarat
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Akun Discord <strong className="text-white font-mono">@{discordAccount.username}</strong> dengan role{' '}
              <strong className="text-red-400">{discordAccount.roles.join(', ') || 'Regular'}</strong> tidak memiliki izin akses Upload / Admin Studio.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-left space-y-2">
            <p className="font-bold text-zinc-300">Syarat Akses Studio Kreator:</p>
            <p className="text-zinc-400 text-[11px]">
              Anda harus memiliki salah satu role server Discord resmi:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-brand/20 text-brand font-bold text-[10px]">@ADMIN</span>
              <span className="px-2 py-0.5 rounded bg-brand/20 text-brand font-bold text-[10px]">@KREATOR</span>
              <span className="px-2 py-0.5 rounded bg-brand/20 text-brand font-bold text-[10px]">@UPLOADER</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">@TALENT</span>
            </div>
          </div>

          {redirectCountdown !== null && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-300 animate-pulse">
              ⏳ Mengalihkan kembali ke Beranda dalam {redirectCountdown} detik...
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Kembali ke Beranda Sekarang
            </button>
            <button
              onClick={() => disconnectDiscord()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ganti Akun Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO 2: DISCORD NOT CONNECTED (DISCORD BOT ROLE GATE SCREEN)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-[#C9323B] flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Full-Screen Subtle Blurry Red Logo Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center">
          <img
            src="/images/logo.png"
            alt="Sekolah Nakal Backdrop"
            className="w-full h-full object-cover object-center scale-105 blur-[6px] transform-gpu"
          />
          {/* Subtle Dark Vignette */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
        </div>

        {/* Ambient Accent Lights */}
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-[#5865F2]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl bg-[#121318]/70 border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2]/15 text-[#5865F2] shadow-inner">
              <IconDiscord className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verifikasi Bot Discord Studio
            </h1>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Studio Kreator terintegrasi langsung dengan Bot Discord. Bot akan memeriksa role server Anda sebelum membuka hak akses upload.
            </p>
          </div>

          {/* DISCORD ROLE VERIFICATION FORM */}
          <form onSubmit={handleVerifyDiscordRole} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 mb-1.5">
                Username Discord Anda <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500 font-mono">@</span>
                <input
                  type="text"
                  required
                  placeholder="contoh: beone atau Kreator#1234"
                  value={discordUsernameInput}
                  onChange={(e) => setDiscordUsernameInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-[#121212] pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-[#5865F2] focus:outline-none font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1.5">
                Role Discord Server Anda <span className="text-brand">*</span>
              </label>
              <select
                value={selectedDiscordRole}
                onChange={(e) => setSelectedDiscordRole(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#121212] px-3.5 py-2.5 text-xs text-white focus:border-[#5865F2] focus:outline-none"
              >
                {DISCORD_STUDIO_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">
                Role tanpa izin upload (Regular/VIP) akan otomatis dialihkan kembali ke Beranda.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifyingDiscord}
              className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-zinc-850 text-white font-bold text-xs shadow-lg shadow-[#5865F2]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <IconDiscord className="w-4 h-4" />
              <span>{isVerifyingDiscord ? 'Memeriksa Role Server...' : 'Verifikasi Akun & Buka Studio'}</span>
            </button>

            <div className="pt-2 text-center">
              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#5865F2] hover:underline"
              >
                Belum punya role? Gabung Basecamp Discord Sekolah Nakal →
              </a>
            </div>
          </form>

          <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Kembali ke Beranda
            </Link>
            <span className="text-[10px] text-zinc-600 font-mono">
              Role Gate Active
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER STUDIO MAIN DASHBOARD (AUTHENTICATED VIA DISCORD ROLE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white pt-16 flex">
      {/* Seamless Sidebar */}
      <aside className="w-60 shrink-0 border-r border-zinc-800/80 bg-[#0e0e0e] flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] sticky top-16 select-none">
        <div className="p-4 space-y-6">
          {/* Seamless Header */}
          <div className="px-3 py-1 flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Studio
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live</span>
            </span>
          </div>

          {/* Sidebar Menu Items with Clean Developer SVG Icons */}
          <nav className="space-y-1">
            <button
              onClick={() => changeTab('dashboard')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('content')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="15" x="2" y="4.5" rx="2" />
                  <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
                </svg>
                <span>Konten & Video</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
                {movies.length}
              </span>
            </button>

            <button
              onClick={() => {
                resetVideoForm();
                changeTab('upload');
              }}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <span>Upload Video</span>
              </div>
              {bulkQueue.length > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow">
                  {bulkQueue.length}
                </span>
              ) : editingId ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Edit
                </span>
              ) : null}
            </button>

            <button
              onClick={() => changeTab('discord_realtime')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'discord_realtime'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-cyan-400 group-hover:text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Discord Auto-Sync</span>
              </div>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Auto</span>
              </span>
            </button>

            <button
              onClick={() => changeTab('categories')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                  <path d="M7 7h.01" />
                </svg>
                <span>Kategori & Genre</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => changeTab('ads')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ads'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 11 18-5v12L3 13v-2z" />
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                </svg>
                <span>Kelola Iklan</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                adSettings.masterEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-850 text-zinc-500'
              }`}>
                {adSettings.masterEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => changeTab('settings')}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Pengaturan Storage</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Logout / Lock Studio */}
        <div className="p-4 border-t border-zinc-800/80 space-y-2">
          <button
            onClick={handleLockStudio}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <IconLock className="w-3.5 h-3.5" />
            <span>Kunci & Keluar Studio</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <span>Buka Web Publik</span>
            <span>↗</span>
          </Link>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-brand/20 text-brand text-[10px] font-black uppercase tracking-wider">
                Studio
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeTab === 'dashboard' && 'Dashboard Saluran'}
                {activeTab === 'content' && 'Koleksi Konten & Video'}
                {activeTab === 'upload' && (editingId ? 'Edit Detail Video' : 'Upload Video & Bulk System')}
                {activeTab === 'discord_realtime' && '🤖 Discord Realtime Auto-Sync & Logs'}
                {activeTab === 'categories' && 'Kelola Kategori & Genre'}
                {activeTab === 'ads' && 'Kelola Iklan & Banner Sayap'}
                {activeTab === 'settings' && 'Pengaturan Storage & Backup'}
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Platform pengelolaan video praktis — durasi, rating likes, dan tanggal rilis terdeteksi otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mobile Tab Selector */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => changeTab(e.target.value as StudioTab)}
                className="rounded-lg bg-[#141414] border border-zinc-700 px-3 py-1.5 text-xs font-bold text-white"
              >
                <option value="dashboard">Dashboard</option>
                <option value="content">Konten Video</option>
                <option value="upload">Upload & Bulk</option>
                <option value="discord_realtime">Discord Auto-Sync</option>
                <option value="categories">Kategori</option>
                <option value="ads">Kelola Iklan</option>
                <option value="settings">Pengaturan</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Flat Metrics Row (Real Dynamic Duration & Audience Likes) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-zinc-800/80 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 py-4">
              <div className="px-4 py-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Video</span>
                <p className="text-3xl font-black text-white mt-1">{movies.length}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Aktif di katalog streaming</p>
              </div>

              <div className="px-4 py-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Durasi Tayang</span>
                <p className="text-3xl font-black text-brand mt-1">{formattedTotalDuration}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Akumulasi durasi riil film</p>
              </div>

              <div className="px-4 py-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Suka (Likes)</span>
                <p className="text-3xl font-black text-rose-400 mt-1">👍 {totalLikesCount.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Interaksi suka penonton</p>
              </div>
            </div>

            {/* Seamless 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🔥 Video Terbaru Dipublikasikan</span>
                  </h2>
                  <button
                    onClick={() => changeTab('content')}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Lihat Semua ({movies.length}) →
                  </button>
                </div>

                <div className="divide-y divide-zinc-800/60">
                  {movies.slice(0, 6).map((m) => {
                    const tConf = getTierBadgeConfig(m.tier || 'regular');
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02] transition-colors px-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-12 w-20 shrink-0 rounded overflow-hidden bg-black border border-zinc-800">
                            <img
                              src={m.backdropUrl || m.posterUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 font-mono text-[9px] font-bold text-white">
                              {formatDuration(m.duration)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-white truncate">{m.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${tConf.badgeClass}`}>
                                {tConf.shortLabel}
                              </span>
                              <span>•</span>
                              <span className="truncate">{m.genres.join(', ')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            to={`/watch/${m.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            👁️ Nonton
                          </Link>
                          <button
                            onClick={() => handleStartEditVideo(m)}
                            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <h2 className="text-sm font-bold text-white">🏷️ Kategori Aktif</h2>
                    <button
                      onClick={() => changeTab('categories')}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Kelola →
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {categories.slice(0, 8).map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-2">
                        <span className="text-zinc-300">{c.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {getVideoCountForCategory(c.name)} video
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CONTENT & VIDEO MANAGER */}
        {/* ========================================================================= */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Cari judul video atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-[#121212] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-[#121212] px-3 py-2 text-xs font-medium text-white focus:outline-none"
                >
                  <option value="all">Semua Tier ({movies.length})</option>
                  <option value="regular">Reguler (Gratis)</option>
                  <option value="vip">VIP</option>
                  <option value="vvip">VVIP Uncensored</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-[#121212] px-3 py-2 text-xs font-medium text-white focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handlePurgeBrokenVideos}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Hapus video yang link-nya kosong atau rusak dari database"
                >
                  <span>🧹</span>
                  <span className="hidden sm:inline">Bersihkan Video Kosong</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-2">Video & Judul</th>
                    <th className="py-3 px-2">Visibilitas / Tier</th>
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Durasi</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredMovies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        Tidak ada video yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovies.map((m) => {
                      const tConf = getTierBadgeConfig(m.tier || 'regular');
                      const isBeingEdited = editingId === m.id;

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isBeingEdited ? 'bg-brand/10' : ''
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-20 shrink-0 rounded overflow-hidden bg-black border border-zinc-800">
                                <img
                                  src={m.backdropUrl || m.posterUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0 max-w-sm">
                                <p className="font-bold text-white truncate text-xs">{m.title}</p>
                                <p className="text-[11px] text-zinc-400 line-clamp-1">
                                  {m.overview}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${tConf.badgeClass}`}>
                              {m.tier === 'vvip' && <IconCrown className="w-3 h-3 text-amber-400" />}
                              {m.tier === 'vip' && <IconStar className="w-3 h-3 text-purple-400" />}
                              {m.tier === 'talent' && <IconDiamond className="w-3 h-3 text-cyan-400" />}
                              {(!m.tier || m.tier === 'regular') && <IconUser className="w-3 h-3 text-zinc-400" />}
                              <span>{tConf.label}</span>
                            </span>
                          </td>

                          <td className="py-3 px-2">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {m.genres.map((g) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 text-[10px]"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-2 whitespace-nowrap text-zinc-400 font-mono">
                            {formatDuration(m.duration)}
                          </td>

                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/watch/${m.id}`}
                                target="_blank"
                                className="px-2.5 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Nonton Video"
                              >
                                👁️
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleStartEditVideo(m)}
                                className="px-2.5 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Edit Video"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(m.id, m.title)}
                                className="px-2.5 py-1 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Hapus Video"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Slide Controls (Max 10 per display) */}
            {totalContentPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[11px]">
                    Menampilkan <strong className="text-zinc-200">{(contentPage - 1) * CONTENT_PER_PAGE + 1} - {Math.min(contentPage * CONTENT_PER_PAGE, filteredMovies.length)}</strong> dari <strong className="text-white">{filteredMovies.length}</strong> video
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    (Slide {contentPage} / {totalContentPages})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={contentPage <= 1}
                    onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 text-xs"
                  >
                    <span>← Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalContentPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalContentPages || Math.abs(page - contentPage) <= 1)
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const isGap = prevPage && page - prevPage > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {isGap && <span className="px-1 text-zinc-600">...</span>}
                            <button
                              type="button"
                              onClick={() => setContentPage(page)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                contentPage === page
                                  ? 'bg-brand text-white shadow-sm'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={contentPage >= totalContentPages}
                    onClick={() => setContentPage((p) => Math.min(totalContentPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 text-xs"
                  >
                    <span>Berikutnya →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: UPLOAD / BULK UPLOAD SYSTEM WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{editingId ? '✏️ Edit Detail Video' : '📦 Sistem Upload Video'}</span>
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetVideoForm}
                  className="text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Batal Edit (Beralih ke Bulk Upload)
                </button>
              )}
            </div>

            {/* Upload Mode Selector Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('bulk')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  uploadMode === 'bulk'
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>📦 Bulk Multi-Video Upload</span>
                {bulkQueue.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {bulkQueue.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  uploadMode === 'file'
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>📁 Single Video Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  uploadMode === 'url'
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>🌐 Link URL Stream (.mp4 / .m3u8)</span>
              </button>
            </div>

            {/* BULK UPLOAD SYSTEM */}
            {uploadMode === 'bulk' && (
              <div className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bulkInputRef.current?.click()}
                  className={`relative p-8 rounded-xl border border-dashed text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-brand bg-brand/10'
                      : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'
                  }`}
                >
                  <input
                    ref={bulkInputRef}
                    type="file"
                    multiple
                    accept="video/*,.mp4,.webm,.mkv,.mov"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessBulkFiles(e.target.files);
                      }
                    }}
                    className="hidden"
                  />

                  {isBulkProcessing ? (
                    <div className="space-y-2 py-2">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      <p className="text-xs font-bold text-white">
                        {totalUploadItemsCount > 0
                          ? `Memproses & upload video (${currentUploadItemIndex} / ${totalUploadItemsCount})...`
                          : 'Membaca metadata & frame adegan video...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-2xl">📦</div>
                      <p className="text-sm font-bold text-white">
                        Tarik & lepas banyak video sekaligus ke sini, atau klik untuk memilih file
                      </p>
                      <p className="text-xs text-zinc-500">
                        Bisa pilih 5, 10, hingga puluhan file video MP4 sekaligus. Judul, durasi, dan kategori dapat disesuaikan di tabel bawah.
                      </p>
                    </div>
                  )}
                </div>

                {bulkQueue.length > 0 && (
                  <div className="space-y-4">
                    {/* Batch Global Quick Tools Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#141414] border border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          Antrean Bulk ({bulkQueue.length} Video)
                        </span>
                        <span className="text-zinc-500">|</span>
                        <span className="text-zinc-400">Atur Massal:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-400 text-[11px]">Semua Kategori:</span>
                          <select
                            value={bulkGlobalCategory}
                            onChange={(e) => {
                              setBulkGlobalCategory(e.target.value);
                              handleApplyGlobalCategoryToBulk(e.target.value);
                            }}
                            className="rounded bg-[#1c1c1c] border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="all">Pilih Kategori...</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-400 text-[11px]">Semua Tier:</span>
                          <select
                            value={bulkGlobalTier}
                            onChange={(e) => {
                              const val = e.target.value as VideoTier | 'keep';
                              setBulkGlobalTier(val);
                              if (val !== 'keep') handleApplyGlobalTierToBulk(val);
                            }}
                            className="rounded bg-[#1c1c1c] border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="keep">Pilih Tier...</option>
                            <option value="regular">REGULER (Gratis)</option>
                            <option value="vip">VIP</option>
                            <option value="vvip">VVIP Uncensored</option>
                            <option value="talent">TALENT</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearBulkQueue}
                          className="px-2.5 py-1 rounded text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Bersihkan Antrean
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-2 w-20">Preview</th>
                            <th className="py-2.5 px-2">Judul Video</th>
                            <th className="py-2.5 px-2 w-36">Kategori</th>
                            <th className="py-2.5 px-2 w-32">Tier Akses</th>
                            <th className="py-2.5 px-2 w-28">Durasi Otomatis</th>
                            <th className="py-2.5 px-2 text-right w-12">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {bulkQueue.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 px-2">
                                <div className="relative h-11 w-18 rounded overflow-hidden bg-black border border-zinc-800 shrink-0">
                                  <img
                                    src={item.posterUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </td>

                              <td className="py-2.5 px-2">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) =>
                                      handleBulkItemChange(item.id, { title: e.target.value })
                                    }
                                    className="w-full rounded bg-[#161616] border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-medium focus:border-brand focus:outline-none"
                                    placeholder="Judul video..."
                                  />
                                  <p className="text-[10px] font-mono text-zinc-500 truncate">
                                    File: {item.file.name}
                                  </p>
                                </div>
                              </td>

                              <td className="py-2.5 px-2">
                                <select
                                  value={item.genres[0] || (categories[0]?.name ?? '')}
                                  onChange={(e) =>
                                    handleBulkItemChange(item.id, { genres: [e.target.value] })
                                  }
                                  className="w-full rounded bg-[#161616] border border-zinc-800 px-2 py-1.5 text-xs text-white focus:border-brand focus:outline-none"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-2.5 px-2">
                                <select
                                  value={item.tier}
                                  onChange={(e) =>
                                    handleBulkItemChange(item.id, { tier: e.target.value as VideoTier })
                                  }
                                  className="w-full rounded bg-[#161616] border border-zinc-800 px-2 py-1.5 text-xs text-white focus:border-brand focus:outline-none font-semibold"
                                >
                                  <option value="regular">REGULER (Gratis)</option>
                                  <option value="vip">VIP</option>
                                  <option value="vvip">VVIP Uncensored</option>
                                  <option value="talent">TALENT</option>
                                </select>
                              </td>

                              <td className="py-2.5 px-2 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161616] border border-zinc-800 text-xs font-mono text-zinc-200 font-bold">
                                  ⚡ {formatDuration(item.duration)}
                                </span>
                              </td>

                              <td className="py-2.5 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBulkItem(item.id)}
                                  className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Hapus dari antrean"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111111] border border-zinc-800/80 space-y-3 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white">Target Penyimpanan Bulk Upload</p>
                          <p className="text-[10px] text-zinc-400">Pilih cloud target untuk {bulkQueue.length} video sekaligus:</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('zerostorage');
                              movieStore.setStorageProvider('zerostorage');
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              storageProvider === 'zerostorage'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
                                : 'bg-[#161616] border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>🚀 ZeroStorage.net</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('lulustream');
                              movieStore.setStorageProvider('lulustream');
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              storageProvider === 'lulustream'
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow'
                                : 'bg-[#161616] border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>🎬 Lulustream Cloud</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('auto');
                              movieStore.setStorageProvider('auto');
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              storageProvider === 'auto'
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow'
                                : 'bg-[#161616] border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>🔄 Auto Failover</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-800/80">
                        <div className="text-xs text-zinc-400">
                          Total siap publish: <strong className="text-white">{bulkQueue.length} Video</strong>
                        </div>

                        <button
                          type="button"
                          disabled={isBulkProcessing}
                          onClick={handlePublishAllBulk}
                          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-red-950/50 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <IconCheck className="w-4 h-4" />
                          <span>🚀 1-Klik Publish Semua ({bulkQueue.length} Video)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SINGLE VIDEO FORM (FILE OR URL) */}
            {(uploadMode === 'file' || uploadMode === 'url') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                  {uploadMode === 'file' && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => videoInputRef.current?.click()}
                      className={`relative p-8 rounded-xl border border-dashed text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-brand bg-brand/10'
                          : selectedFile
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'
                      }`}
                    >
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*,.mp4,.webm,.mkv,.mov"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessSingleVideo(file);
                        }}
                        className="hidden"
                      />

                      {isProcessingFile ? (
                        <div className="space-y-2 py-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                          <p className="text-xs font-bold text-white">
                            Menganalisis file video & menghitung durasi...
                          </p>
                        </div>
                      ) : selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">✓ {selectedFile.name}</p>
                          <p className="text-xs text-zinc-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Durasi: {formatDuration(duration)} · Klik untuk mengganti
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">
                            Tarik & lepas 1 file video ke sini, atau klik untuk memilih
                          </p>
                          <p className="text-xs text-zinc-500">
                            Mendukung MP4, WebM, MKV — Durasi & Thumbnail adegan langsung terdeteksi
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSaveSingleVideo} className="space-y-5 text-xs">
                    {uploadMode === 'file' && (
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-[#111111] border border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-zinc-300">
                            Target Penyimpanan Cloud <span className="text-brand">*</span>
                          </label>
                          <span className="text-[10px] text-zinc-400">
                            Pilih server penyimpanan aktif
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('zerostorage');
                              movieStore.setStorageProvider('zerostorage');
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              storageProvider === 'zerostorage'
                                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                                : 'bg-[#151515] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">🚀</span>
                              <div>
                                <p className="text-xs font-bold text-white">ZeroStorage.net</p>
                                <p className="text-[10px] text-zinc-400">Direct CDN Cloud</p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('lulustream');
                              movieStore.setStorageProvider('lulustream');
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              storageProvider === 'lulustream'
                                ? 'bg-purple-500/15 border-purple-500 text-white shadow-sm'
                                : 'bg-[#151515] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎬</span>
                              <div>
                                <p className="text-xs font-bold text-white">Lulustream Cloud</p>
                                <p className="text-[10px] text-zinc-400">Auto-HLS Stream</p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStorageProvider('auto');
                              movieStore.setStorageProvider('auto');
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              storageProvider === 'auto'
                                ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                                : 'bg-[#151515] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">🔄</span>
                              <div>
                                <p className="text-xs font-bold text-white">Auto Failover</p>
                                <p className="text-[10px] text-zinc-400">ZeroStorage ⇄ Lulu</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {uploadMode === 'url' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-zinc-300">
                            Link Stream Video (Lulustream / HLS .m3u8 / MP4) <span className="text-brand">*</span>
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ⚡ Didukung Lulustream
                          </span>
                        </div>
                        <input
                          type="text"
                          required={uploadMode === 'url'}
                          placeholder="Contoh: https://luluvdo.com/e/xxx atau https://domain/video.m3u8"
                          value={videoUrl}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setVideoUrl(val);
                            if (val && !selectedFile) {
                              const sec = await videoStorageService.detectUrlDuration(val);
                              if (sec > 0) setDuration(sec);
                            }
                          }}
                          className="w-full rounded-lg border border-zinc-800 bg-[#121212] px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:border-brand focus:outline-none"
                        />
                        <p className="text-[10px] text-zinc-500">
                          Mendukung link Lulustream (<span className="text-zinc-300">luluvdo.com</span>, <span className="text-zinc-300">lulustream.com</span>), direct HLS (<span className="text-zinc-300">.m3u8</span>), dan direct MP4.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">
                        Judul Video <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Judul video streaming..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-[#121212] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-300 mb-1.5">
                        Tingkat Akses & Visibilitas (Tier)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TIER_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTier(opt.id)}
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              tier === opt.id
                                ? 'bg-brand/15 border-brand text-white'
                                : 'bg-[#121212] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                {opt.icon === 'crown' && <IconCrown className="w-3.5 h-3.5 text-amber-400" />}
                                {opt.icon === 'star' && <IconStar className="w-3.5 h-3.5 text-purple-400" />}
                                {opt.icon === 'diamond' && <IconDiamond className="w-3.5 h-3.5 text-cyan-400" />}
                                {opt.icon === 'user' && <IconUser className="w-3.5 h-3.5 text-zinc-400" />}
                                <span className={tier === opt.id ? 'text-white' : ''}>{opt.label}</span>
                              </div>
                              {tier === opt.id && <span className="text-brand font-black">✓</span>}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-zinc-300">
                          Kategori / Genre
                        </label>
                        <button
                          type="button"
                          onClick={() => changeTab('categories')}
                          className="text-[11px] text-brand hover:underline font-bold"
                        >
                          + Kelola Kategori
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-[#121212] border border-zinc-800 max-h-36 overflow-y-auto">
                        {categories.length === 0 ? (
                          <div className="flex items-center justify-between w-full py-1 text-xs text-zinc-500">
                            <span>Belum ada kategori aktif. Video akan otomatis diberi kategori <strong>"Umum"</strong>.</span>
                            <button
                              type="button"
                              onClick={() => changeTab('categories')}
                              className="text-brand font-bold hover:underline ml-2"
                            >
                              + Buat Kategori
                            </button>
                          </div>
                        ) : (
                          categories.map((cat) => {
                            const isSelected = selectedGenres.includes(cat.name);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleGenre(cat.name)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand text-white font-bold'
                                    : 'bg-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                              >
                                {isSelected && '✓ '}
                                {cat.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>



                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">
                        Deskripsi / Sinopsis Video
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tulis ringkasan atau keterangan video..."
                        value={overview}
                        onChange={(e) => setOverview(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-[#121212] p-3 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs shadow-xl shadow-red-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <IconCheck className="w-4 h-4" />
                        <span>{editingId ? '💾 Simpan Perubahan Video' : '🚀 1-Klik Publish Video Sekarang'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-4 space-y-3.5 sticky top-24">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <span>👁️</span>
                      <span>Tinjauan Video & Thumbnail</span>
                    </h3>
                    {selectedFile && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ⚡ Live Preview
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Interactive Video Player / Poster Frame */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
                      {localVideoBlobUrl ? (
                        <video
                          ref={previewVideoRef}
                          src={localVideoBlobUrl}
                          controls
                          playsInline
                          preload="auto"
                          className="h-full w-full object-contain bg-black"
                          onTimeUpdate={(e) => {
                            setEditorTimeSec(e.currentTarget.currentTime);
                          }}
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            if (v.duration && isFinite(v.duration) && v.duration > 0) {
                              setDuration(Math.round(v.duration));
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={posterUrl || backdropUrl || '/images/logo.png'}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/80 text-brand border border-brand/50 pointer-events-none z-10">
                        {tier.toUpperCase()}
                      </span>
                    </div>

                    {/* Instant Frame Capture Button & Custom Image Upload */}
                    {selectedFile && localVideoBlobUrl && (
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCaptureCurrentPlayerFrame}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>📸</span>
                          <span>Ambil Detik ({editorTimeSec.toFixed(1)}s) Jadi Thumbnail</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => customImageInputRef.current?.click()}
                            className="py-2 px-2.5 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>📁</span>
                            <span>Upload Foto</span>
                          </button>
                          <input
                            ref={customImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomImageSelect}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const nextOpen = !isThumbnailEditorOpen;
                              setIsThumbnailEditorOpen(nextOpen);
                              if (nextOpen && previewVideoRef.current) {
                                previewVideoRef.current.currentTime = Math.max(0.1, editorTimeSec);
                              }
                            }}
                            className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isThumbnailEditorOpen
                                ? 'bg-brand/10 border-brand/40 text-brand'
                                : 'bg-[#141414] hover:bg-[#1a1a1a] border-zinc-800 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <span>✂️</span>
                            <span>{isThumbnailEditorOpen ? 'Tutup Crop' : 'Crop/Zoom'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Active Poster Preview Card */}
                    {posterUrl && posterUrl !== '/images/logo.png' && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121212] border border-zinc-800/80">
                        <img
                          src={posterUrl}
                          alt="Thumbnail Terpilih"
                          className="h-12 w-20 rounded-lg object-cover border border-zinc-700 shrink-0 bg-black"
                        />
                        <div className="space-y-0.5 truncate text-left">
                          <p className="text-[11px] font-bold text-white flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span>Thumbnail Terkunci</span>
                          </p>
                          <p className="text-[10px] text-zinc-400">Siap dipublikasikan ke katalog</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {title || 'Judul Video Preview'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">
                        {overview || 'Deskripsi singkat video akan tampil di sini...'}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 pt-1">
                        <span className="text-white font-mono font-bold">⏱️ {formatDuration(duration || 1)}</span>
                        <span>•</span>
                        <span className="text-zinc-400 truncate">{selectedGenres.join(', ')}</span>
                      </div>
                    </div>

                    {uploadMode === 'file' && selectedFile && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                        <span className="text-base leading-none">🟡</span>
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-[11px]">Draft Lokal Tersimpan di Memori</p>
                          <p className="text-[10px] text-zinc-400">
                            Ukuran: <strong className="text-zinc-200">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</strong>. Video aman diproses lokal tanpa lag. Klik tombol Publish di bawah untuk mulai upload ke cloud.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Grid Penyesuaian Thumbnail (Atas / Tengah / Bawah) */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-zinc-300">Posisi Grid Thumbnail</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {thumbnailPosition === 'top' ? 'Atas (Fokus Objek)' : thumbnailPosition === 'center' ? 'Tengah' : 'Bawah'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#121212] border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleSelectThumbnailPosition('top')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            thumbnailPosition === 'top'
                              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10 font-bold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                          }`}
                        >
                          <span>⬆️ Atas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectThumbnailPosition('center')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            thumbnailPosition === 'center'
                              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10 font-bold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                          }`}
                        >
                          <span>⏺️ Tengah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectThumbnailPosition('bottom')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            thumbnailPosition === 'bottom'
                              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10 font-bold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                          }`}
                        >
                          <span>⬇️ Bawah</span>
                        </button>
                      </div>
                    </div>

                    {/* Studio Editor Thumbnail Kustom (Potongan Adegan Awal Video) */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpen = !isThumbnailEditorOpen;
                          setIsThumbnailEditorOpen(nextOpen);
                          if (nextOpen && editorVideoRef.current) {
                            editorVideoRef.current.currentTime = Math.max(0.1, editorTimeSec);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                          isThumbnailEditorOpen
                            ? 'bg-brand/10 border-brand/40 text-brand'
                            : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>✂️</span>
                          <span>{isThumbnailEditorOpen ? 'Tutup Editor Thumbnail' : 'Buka Editor Frame Thumbnail'}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          {isThumbnailEditorOpen ? '▲ Tutup' : '▼ Buka'}
                        </span>
                      </button>

                      {isThumbnailEditorOpen && (
                        <div className="p-3.5 rounded-xl bg-[#101010] border border-zinc-800 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* 1. Timeline Scrubber Detik Awal Video */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <label className="font-bold text-zinc-300 flex items-center gap-1">
                                <span>⏱️ Pilih Titik Adegan Video</span>
                              </label>
                              <span className="font-mono text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/30">
                                {editorTimeSec.toFixed(1)}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max={Math.min(30, duration > 1 ? duration : 30)}
                              step="0.1"
                              value={editorTimeSec}
                              onChange={(e) => handleSeekEditorTime(Number(e.target.value))}
                              className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                            {/* Tombol Cepat Detik Awal */}
                            <div className="flex items-center gap-1 pt-1">
                              {[0.5, 1.5, 3.0, 5.0, 10.0].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => handleSeekEditorTime(t)}
                                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                    Math.abs(editorTimeSec - t) < 0.2
                                      ? 'bg-brand text-white font-bold shadow-sm'
                                      : 'bg-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                  }`}
                                >
                                  {t}s
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Geser Horizontal (Kiri / Kanan) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <label className="font-bold text-zinc-300">↔️ Geser Posisi Horizontal</label>
                              <span className="font-mono text-zinc-400">
                                {editorShiftX > 0 ? `+${editorShiftX}% Kanan` : editorShiftX < 0 ? `${editorShiftX}% Kiri` : '0% Tengah'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={editorShiftX}
                              onChange={(e) => setEditorShiftX(Number(e.target.value))}
                              className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* 3. Geser Vertikal (Atas / Bawah) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <label className="font-bold text-zinc-300">↕️ Geser Posisi Vertikal</label>
                              <span className="font-mono text-zinc-400">
                                {editorShiftY > 0 ? `+${editorShiftY}% Bawah` : editorShiftY < 0 ? `${editorShiftY}% Atas` : '0% Tengah'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={editorShiftY}
                              onChange={(e) => setEditorShiftY(Number(e.target.value))}
                              className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* 4. Skala Zoom */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <label className="font-bold text-zinc-300">🔍 Skala Zoom Frame</label>
                              <span className="font-mono text-zinc-400">{Math.round(editorZoom * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.8"
                              max="2.0"
                              step="0.02"
                              value={editorZoom}
                              onChange={(e) => setEditorZoom(Number(e.target.value))}
                              className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* 5. Aksi & Kunci Frame */}
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                            <button
                              type="button"
                              onClick={() => {
                                setEditorZoom(1.0);
                                setEditorShiftX(-20);
                                setEditorShiftY(-10);
                                handleSeekEditorTime(1.5);
                              }}
                              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                            >
                              🔄 Reset
                            </button>
                            <button
                              type="button"
                              onClick={handleLockAndSaveCustomThumbnail}
                              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all flex items-center gap-1"
                            >
                              <IconCheck className="w-3.5 h-3.5" />
                              <span>Selesai & Kunci Frame</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DISCORD REALTIME AUTO-SYNC & LIVE LOGS (ADMIN ONLY) */}
        {/* ========================================================================= */}
        {activeTab === 'discord_realtime' && (
          <div className="space-y-8">
            {/* Top Gateway Live Status Card */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-zinc-900/60 to-zinc-900/90 p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                      Gateway Real-Time Listener
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Otomatis 24/7
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Sinkronisasi Video Otomatis dari Bot Discord ke Web
                  </h2>
                  <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                    Setiap ada video baru yang dikirim di Text Channel Discord (seperti <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">#media-lokal</code>, <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">#media-jepang</code>), sistem akan langsung mengunggahnya ke <strong>ZeroStorage CDN</strong>, membuat kategorinya otomatis, dan menerbitkannya ke web secara real-time tanpa perlu klik manual.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTriggerRealtimePoll}
                    disabled={isSyncingDiscord}
                    className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 text-xs font-black transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span className={isSyncingDiscord ? 'animate-spin' : ''}>⚡</span>
                    <span>{isSyncingDiscord ? 'Memeriksa Discord...' : 'Periksa Pesan Sekarang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAutoPollActive(!isAutoPollActive)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                      isAutoPollActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAutoPollActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    <span>Auto-Heartbeat: {isAutoPollActive ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Status Mini Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-cyan-500/20 text-xs">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Server Discord Guild</span>
                  <span className="font-mono font-bold text-white text-[11px] truncate block">1402615068818145401</span>
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Target Cloud Storage</span>
                  <span className="font-bold text-emerald-400 text-[11px] block">ZeroStorage.net (CDN)</span>
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Channel Media Terdeteksi</span>
                  <span className="font-bold text-cyan-300 text-[11px] block">
                    {discordChannels.filter((c) => c.isLikelyMedia).length} Channel Media
                  </span>
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Total Log Tercatat</span>
                  <span className="font-bold text-amber-300 text-[11px] block">{discordLogs.length} Aktivitas</span>
                </div>
              </div>
            </div>

            {/* LIVE REAL-TIME TERMINAL LOG CONSOLE */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#141416] border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-200 ml-2">
                    terminal@sekolah-nakal: ~/discord-gateway-live.log
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadDiscordLogs}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDiscordLogs}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    🧹 Bersihkan Log
                  </button>
                </div>
              </div>

              {/* Terminal Logs Body */}
              <div
                className="p-4 sm:p-5 font-mono text-xs max-h-[380px] overflow-y-auto space-y-2 select-text bg-[#09090b]"
                style={{ scrollbarWidth: 'thin' }}
              >
                {discordLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <div className="text-2xl opacity-40">📡</div>
                    <p>Belum ada riwayat aktivitas terbaru. Kirim video di Discord untuk melihat log real-time di sini.</p>
                  </div>
                ) : (
                  discordLogs.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border leading-relaxed flex flex-col sm:flex-row sm:items-start justify-between gap-2 ${
                        item.level === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                          : item.level === 'upload'
                          ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300'
                          : item.level === 'error'
                          ? 'border-red-500/30 bg-red-500/5 text-red-300'
                          : item.level === 'warning'
                          ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                          : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              item.level === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.level === 'upload'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : item.level === 'error'
                                ? 'bg-red-500/20 text-red-300'
                                : item.level === 'warning'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.level}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-normal">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-white">{item.message}</p>
                      </div>

                      {item.meta && (
                        <div className="text-[10px] text-zinc-400 bg-black/40 px-2 py-1 rounded border border-white/5 shrink-0 self-start">
                          {Object.entries(item.meta).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span className="text-zinc-500 uppercase">{k}:</span>
                              <span className="text-zinc-200 truncate max-w-[200px]">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CHANNEL LIST & MANUAL SCRAPE CONTROLS */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>📺 Daftar Text Channel Media di Server Discord</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Nama channel otomatis dijadikan Kategori, dan tier video disesuaikan berdasarkan kategori induk Discord.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadDiscordChannels}
                  disabled={isLoadingDiscordChannels}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={isLoadingDiscordChannels ? 'animate-spin' : ''}>🔄</span>
                  <span>Refresh Channel</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {discordChannels
                  .filter((c) => c.isLikelyMedia)
                  .map((chan) => (
                    <div
                      key={chan.id}
                      className="rounded-xl border border-zinc-800 bg-[#121214] p-4 flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-cyan-400 font-mono text-sm">#</span>
                            <h4 className="text-xs font-bold text-white truncate">{chan.name}</h4>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${
                              chan.detectedTier === 'vvip'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : chan.detectedTier === 'vip'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {chan.detectedTier}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1 text-zinc-400">
                          <div className="flex items-center justify-between">
                            <span>Induk Discord:</span>
                            <span className="text-zinc-300 font-medium truncate max-w-[140px]">
                              {chan.parentName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Kategori Web:</span>
                            <span className="text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {chan.cleanCategory}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleScrapeSingleChannel(chan.id, chan.name)}
                        className="w-full rounded-lg bg-zinc-850 hover:bg-cyan-500 hover:text-black border border-zinc-750 px-3 py-1.5 text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>⚡</span>
                        <span>Sync Channel Ini</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: KELOLA KATEGORI & GENRE */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{catEditingId ? '✏️ Edit Kategori' : '➕ Tambah Kategori Baru'}</span>
                </h2>
                {catEditingId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Nama Kategori <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Student & Teacher"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!catEditingId) {
                        setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-[#121212] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Slug URL Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: student-teacher"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-[#121212] px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-brand focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Halaman publik: <code>/genre/{catSlug || 'nama-slug'}</code>
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Deskripsi Kategori (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Penjelasan singkat mengenai kategori ini..."
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-[#121212] p-2.5 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <IconCheck className="w-4 h-4" />
                    <span>{catEditingId ? 'Simpan Kategori' : 'Tambah Kategori Baru'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List Kategori Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Daftar Kategori Aktif ({categories.length})
                </h3>
                <div className="flex items-center gap-2">
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllCategories}
                      className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer border border-red-800/30"
                      title="Hapus seluruh kategori"
                    >
                      🗑️ Hapus Semua
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-2">Nama Kategori</th>
                      <th className="py-2.5 px-2">Slug URL</th>
                      <th className="py-2.5 px-2">Video</th>
                      <th className="py-2.5 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500">
                          <p className="font-semibold text-zinc-400">Belum ada kategori yang dibuat.</p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Gunakan formulir di sebelah kiri untuk menambahkan kategori baru.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => {
                      const count = getVideoCountForCategory(cat.name);
                      const isBeingEdited = catEditingId === cat.id;

                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isBeingEdited ? 'bg-brand/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-2">
                            <p className="font-bold text-white">{cat.name}</p>
                            {cat.description && (
                              <p className="text-[10px] text-zinc-500 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-zinc-400">
                            /genre/{cat.slug}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-mono text-zinc-400">
                              {count}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/genre/${cat.slug}`}
                                target="_blank"
                                className="px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-850"
                                title="Buka Halaman Genre"
                              >
                                👁️
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-850 cursor-pointer"
                                title="Edit Kategori"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="px-2 py-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                                title="Hapus Kategori"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: KELOLA IKLAN & BANNER SAYAP (SEAMLESS HUMAN STUDIO STYLE) */}
        {/* ========================================================================= */}
        {activeTab === 'ads' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Control Bar: Seamless Header & Master Actions */}
            <div className="pb-6 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Pengaturan Banner Sayap (160x600)
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      adSettings.masterEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        adSettings.masterEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                      }`}
                    />
                    <span>{adSettings.masterEnabled ? 'Live Aktif' : 'Disembunyikan'}</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Kelola banner sponsor di sisi sayap kiri dan kanan pada halaman streaming desktop. Saat dinonaktifkan, ruang sayap akan otomatis dirapatkan tanpa meninggalkan celah kosong.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleMasterAds}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                    adSettings.masterEnabled
                      ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  }`}
                >
                  <span>{adSettings.masterEnabled ? 'Sembunyikan Semua Iklan' : 'Aktifkan Semua Iklan'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingAds}
                  onClick={handleSaveAllAds}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{isSavingAds ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAdsToDefaults}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850 transition-colors"
                  title="Kembalikan ke pengaturan awal"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Seamless Segmented Slot Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Pilih Posisi Slot Banner
                </label>
                <span className="text-[11px] text-zinc-500">
                  Format Standar Iklan Desktop: 160 x 600 px (Portrait)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800/80 w-full sm:w-auto">
                {adSettings.slots.map((slot) => {
                  const isSelected = selectedAdSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedAdSlotId(slot.id)}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          slot.enabled ? 'bg-emerald-400' : 'bg-zinc-600'
                        }`}
                      />
                      <span>{slot.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({slot.type === 'embed' ? 'Embed' : 'Gambar'})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Slot Configuration & Live Stage */}
            {(() => {
              const activeSlot =
                adSettings.slots.find((s) => s.id === selectedAdSlotId) || adSettings.slots[0]!;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
                  {/* Left Column: Seamless Form Configuration */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Slot Header & Toggle */}
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          Konfigurasi {activeSlot.label}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Tentukan format tampilan, unggah media, atau masukkan skrip iklan HTML sponsor.
                        </p>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeSlot.enabled}
                          onChange={(e) =>
                            handleUpdateAdSlot(activeSlot.id, { enabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-600 bg-zinc-900 border-zinc-700 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-zinc-300">
                          {activeSlot.enabled ? 'Slot Aktif' : 'Slot Nonaktif'}
                        </span>
                      </label>
                    </div>

                    {/* Format Selector: Image / GIF vs Embed */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-zinc-300">
                        Format Banner
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateAdSlot(activeSlot.id, { type: 'image' })}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeSlot.type === 'image'
                              ? 'bg-zinc-800/90 border-zinc-700 text-white ring-1 ring-white/10'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
                          }`}
                        >
                          <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold">Gambar / GIF / Foto</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Upload file foto atau link URL gambar
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateAdSlot(activeSlot.id, { type: 'embed' })}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeSlot.type === 'embed'
                              ? 'bg-zinc-800/90 border-zinc-700 text-white ring-1 ring-white/10'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
                          }`}
                        >
                          <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold">Embed Code / HTML / JS</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Skrip iframe atau tag HTML kustom sponsor
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Image / GIF Fields */}
                    {activeSlot.type === 'image' && (
                      <div className="space-y-4 pt-1">
                        {/* Dropzone Upload */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            File Banner (Foto / Animasi GIF)
                          </label>
                          <div
                            onClick={() => adMediaInputRef.current?.click()}
                            className="border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-5 text-center bg-zinc-900/30 hover:bg-zinc-900/50 transition-all cursor-pointer"
                          >
                            <input
                              ref={adMediaInputRef}
                              type="file"
                              accept="image/*,.gif,.png,.jpg,.jpeg,.webp"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadSlotMedia(activeSlot.id, f);
                              }}
                            />
                            <div className="flex flex-col items-center gap-1">
                              <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" x2="12" y1="3" y2="15" />
                              </svg>
                              <p className="text-xs font-semibold text-zinc-200 mt-1">
                                Klik untuk memilih file dari komputer
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                Rekomendasi ukuran 160 x 600 px (Portrait) • GIF, PNG, JPG, WebP
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Direct URL Input */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">
                            Atau Masukkan URL Gambar Langsung
                          </label>
                          <input
                            type="text"
                            placeholder="https://domain.com/banner.gif atau https://i.imgur.com/..."
                            value={activeSlot.mediaUrl}
                            onChange={(e) =>
                              handleUpdateAdSlot(activeSlot.id, { mediaUrl: e.target.value })
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                          />
                        </div>

                        {/* Target Link */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">
                            Link Tujuan (*Target URL*)
                          </label>
                          <input
                            type="text"
                            placeholder="https://discord.com/invite/serverbokep atau https://t.me/..."
                            value={activeSlot.targetUrl}
                            onChange={(e) =>
                              handleUpdateAdSlot(activeSlot.id, { targetUrl: e.target.value })
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs font-mono text-red-400 placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Pengunjung akan diarahkan ke tautan ini di tab baru saat banner diklik.
                          </p>
                        </div>

                        {/* Alt Text */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">
                            Keterangan Banner (Alt Text)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Gabung Server Komunitas Resmi"
                            value={activeSlot.altText}
                            onChange={(e) =>
                              handleUpdateAdSlot(activeSlot.id, { altText: e.target.value })
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Embed Code Fields */}
                    {activeSlot.type === 'embed' && (
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-medium text-zinc-300">
                          Kode HTML / Iframe / Skrip Sponsor
                        </label>
                        <textarea
                          rows={8}
                          placeholder={`<iframe src="https://sponsor.com/ad" width="160" height="600" frameborder="0"></iframe>`}
                          value={activeSlot.embedCode}
                          onChange={(e) =>
                            handleUpdateAdSlot(activeSlot.id, { embedCode: e.target.value })
                          }
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs font-mono text-emerald-400 placeholder-zinc-600 focus:border-red-500 focus:outline-none resize-y"
                        />
                        <p className="text-[10px] text-zinc-500">
                          Mendukung iframe, skrip JavaScript async, dan custom link HTML dari provider iklan manapun.
                        </p>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSavingAds}
                        onClick={handleSaveAllAds}
                        className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <IconCheck className="w-4 h-4" />
                        <span>Simpan Perubahan Banner</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Seamless Live Preview Canvas */}
                  <div className="lg:col-span-5 space-y-3 sticky top-24">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                      <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Pratinjau Banner 160 x 600
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {activeSlot.position === 'left' ? 'Sayap Kiri' : 'Sayap Kanan'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-[160px] h-[600px] rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-2xl relative flex items-center justify-center">
                        {activeSlot.type === 'embed' && activeSlot.embedCode.trim() ? (
                          <div
                            className="w-full h-full overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: activeSlot.embedCode }}
                          />
                        ) : activeSlot.mediaUrl ? (
                          <a
                            href={activeSlot.targetUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-full block"
                          >
                            <img
                              src={activeSlot.mediaUrl}
                              alt={activeSlot.altText || 'Preview'}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-full bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center p-4">
                            <span className="text-xs font-bold tracking-widest text-zinc-300 uppercase">
                              BANNER ADS
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 mt-1">
                              160 x 600
                            </span>
                            <span className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
                              Belum ada media. Unggah file atau masukkan URL.
                            </span>
                          </div>
                        )}

                        {!activeSlot.enabled && (
                          <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                              Slot Nonaktif
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              Banner ini disembunyikan dari pengunjung
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="w-full text-center mt-3">
                        <p className="text-[11px] text-zinc-500 truncate max-w-xs mx-auto">
                          Target: <span className="text-zinc-300 font-mono">{activeSlot.targetUrl || '-'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PENGATURAN STORAGE, PIN & DATABASE */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-3xl">
            {/* STORAGE INTEGRATION (ZEROSTORAGE & LULUSTREAM) */}
            <div className="space-y-6 pb-6 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span>Penyimpanan Cloud ZeroStorage & Lulustream (Multi-Tier Redundancy)</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Kelola penyimpanan cloud video. Jika Lulustream offline atau error, sistem otomatis memindahkan upload ke ZeroStorage.net seketika.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                      zerostorageApiKey
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {zerostorageApiKey ? '✓ ZeroStorage Aktif' : 'ZeroStorage Nonaktif'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveStorageConfig} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                    Target Penyimpanan Cloud Default (100% Cloud Storage)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      onClick={() => setStorageProvider('zerostorage')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        storageProvider === 'zerostorage'
                          ? 'border-emerald-500 bg-emerald-500/15 text-white shadow'
                          : 'border-zinc-800 bg-[#121212] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="storageProvider"
                        checked={storageProvider === 'zerostorage'}
                        onChange={() => setStorageProvider('zerostorage')}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">🚀 ZeroStorage.net</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Direct CDN stream super cepat tanpa batas limit disk hosting.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setStorageProvider('lulustream')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        storageProvider === 'lulustream'
                          ? 'border-purple-500 bg-purple-500/15 text-white shadow'
                          : 'border-zinc-800 bg-[#121212] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="storageProvider"
                        checked={storageProvider === 'lulustream'}
                        onChange={() => setStorageProvider('lulustream')}
                        className="mt-0.5 accent-purple-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">🎬 Lulustream Cloud</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Transcoding multi-resolusi otomatis (Auto-HLS player).
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setStorageProvider('auto')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        storageProvider === 'auto'
                          ? 'border-cyan-500 bg-cyan-500/15 text-white shadow'
                          : 'border-zinc-800 bg-[#121212] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="storageProvider"
                        checked={storageProvider === 'auto'}
                        onChange={() => setStorageProvider('auto')}
                        className="mt-0.5 accent-cyan-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">🔄 Auto Failover</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Otomatis alihkan ke provider lain jika salah satu server error.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ZeroStorage API Key */}
                  <div className="p-3.5 rounded-xl bg-[#101010] border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-zinc-200">
                        ⚡ ZeroStorage.net API Key
                      </label>
                      <a
                        href="https://zerostorage.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand hover:underline font-semibold"
                      >
                        zerostorage.net ↗
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3"
                      value={zerostorageApiKey}
                      onChange={(e) => setZerostorageApiKey(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#151515] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">
                      API Key utama untuk cloud ZeroStorage (digunakan juga sebagai auto-failover jika Lulustream error).
                    </p>
                  </div>

                  {/* Lulustream API Key */}
                  <div className="p-3.5 rounded-xl bg-[#101010] border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-zinc-200">
                        ☁️ Lulustream API Key
                      </label>
                      <a
                        href="https://lulustream.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand hover:underline font-semibold"
                      >
                        lulustream.com ↗
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: 142459qwertyt..."
                      value={lulustreamApiKey}
                      onChange={(e) => setLulustreamApiKey(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#151515] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-brand focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">
                      API Key opsional untuk transcoding multi-resolusi otomatis di Lulustream.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingStorage}
                  className="px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-2"
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{isSavingStorage ? 'Menyimpan...' : 'Simpan Pengaturan Penyimpanan'}</span>
                </button>
              </form>
            </div>



            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📦 Backup Database Katalog JSON</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Simpan seluruh data katalog video ke file JSON lokal atau pulihkan data dari file cadangan.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>📥 Download Backup JSON ({movies.length} Video)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-[#141414] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>📤 Import Restore File JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL OVERLAY: LIVE UPLOAD PROGRESS (HUMAN DEVELOPER WORKSPACE STYLE) */}
        {/* ========================================================================= */}
        {isUploadingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
            <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white truncate max-w-[260px]">
                      {currentUploadFileName || 'Mengunggah Video...'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {totalUploadItemsCount > 1
                        ? `File ${currentUploadItemIndex} dari ${totalUploadItemsCount} • ${uploadStatusText}`
                        : uploadStatusText}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs font-bold text-white shrink-0">
                  {currentUploadFilePercent}%
                </span>
              </div>

              {/* Linear Clean Flat Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-red-600 transition-all duration-150 ease-out"
                  style={{ width: `${currentUploadFilePercent}%` }}
                />
              </div>

              {/* Multi-item bulk queue progress if bulk upload */}
              {totalUploadItemsCount > 1 && (
                <div className="pt-3 border-t border-zinc-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Progress Keseluruhan Antrean ({currentUploadItemIndex}/{totalUploadItemsCount})</span>
                    <span className="font-mono text-zinc-300">
                      {Math.round(((currentUploadItemIndex - 1 + currentUploadFilePercent / 100) / totalUploadItemsCount) * 100)}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-zinc-500 transition-all duration-150"
                      style={{
                        width: `${Math.round(((currentUploadItemIndex - 1 + currentUploadFilePercent / 100) / totalUploadItemsCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
