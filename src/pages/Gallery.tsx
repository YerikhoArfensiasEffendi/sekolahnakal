/**
 * Galeri Semua Video (See All Video Gallery)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - 🎬 Format Galeri Grid Responsif (Maksimal 20 Video per Halaman)
 * - 🔢 Mode Navigasi Slot Angka (Pagination 1, 2, 3, 4, ... dengan tombol loncat slot)
 * - 🔍 Filter multi-dimensi (Tier, Kategori/Genre, Pencarian Teks, Urutan/Sort)
 * - ⚡ URL Sync (?page=1&tier=vvip&genre=cosplay&sort=trending)
 * - 🛡️ Dukungan Sayap Iklan & Status Real-time
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { movieStore } from '@/services/movieStore.service';
import { categoryStore } from '@/services/categoryStore.service';
import { MovieCard } from '@/components/movie/MovieCard';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
} from '@/components/icons';

const ITEMS_PER_PAGE = 20;

const TIER_OPTIONS = [
  { id: 'all', label: 'Semua Video', shortLabel: 'Semua', iconType: 'all' },
  { id: 'regular', label: 'REGULER', shortLabel: 'Reguler', iconType: 'user', color: 'text-gray-300' },
  { id: 'vvip', label: 'EXCLUSIF VVIP', shortLabel: 'VVIP', iconType: 'crown', color: 'text-amber-300' },
  { id: 'vip', label: 'EXCLUSIF VIP', shortLabel: 'VIP', iconType: 'star', color: 'text-purple-300' },
  { id: 'talent', label: 'EXCLUSIF TALENT', shortLabel: 'Talent', iconType: 'diamond', color: 'text-cyan-300' },
];

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const galleryRef = useRef<HTMLDivElement | null>(null);

  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlTier = searchParams.get('tier') || 'all';
  const urlGenre = searchParams.get('genre') || 'all';
  const urlSort = (searchParams.get('sort') as any) || 'trending';
  const urlQuery = searchParams.get('q') || '';

  const [currentPage, setCurrentPage] = useState<number>(urlPage > 0 ? urlPage : 1);
  const [activeTier, setActiveTier] = useState<string>(urlTier);
  const [activeGenre, setActiveGenre] = useState<string>(urlGenre);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [sortBy, setSortBy] = useState<'trending' | 'popular' | 'new' | 'duration'>(urlSort);

  const [allMovies, setAllMovies] = useState<Movie[]>(() => movieStore.getAll());
  const [categories, setCategories] = useState(() => categoryStore.getAll());

  // Listen to live database updates
  useEffect(() => {
    const handleUpdate = () => {
      setAllMovies(movieStore.getAll());
      setCategories(categoryStore.getAll());
    };
    window.addEventListener('sekolah_nakal_movies_updated', handleUpdate);
    window.addEventListener('sekolah_nakal_categories_updated', handleUpdate);
    return () => {
      window.removeEventListener('sekolah_nakal_movies_updated', handleUpdate);
      window.removeEventListener('sekolah_nakal_categories_updated', handleUpdate);
    };
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    if (p > 0) setCurrentPage(p);
    const t = searchParams.get('tier');
    if (t) setActiveTier(t);
    const g = searchParams.get('genre');
    if (g) setActiveGenre(g);
    const s = searchParams.get('sort') as any;
    if (s) setSortBy(s);
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  // Update URL params helper
  const updateUrlParams = (newPage: number, newTier: string, newGenre: string, newSort: string, newSearch: string) => {
    const params: Record<string, string> = {};
    if (newPage > 1) params.page = String(newPage);
    if (newTier !== 'all') params.tier = newTier;
    if (newGenre !== 'all') params.genre = newGenre;
    if (newSort !== 'trending') params.sort = newSort;
    if (newSearch.trim()) params.q = newSearch.trim();
    setSearchParams(params);
  };

  // Change Tier Filter
  const handleSelectTier = (tierId: string) => {
    setActiveTier(tierId);
    setCurrentPage(1);
    updateUrlParams(1, tierId, activeGenre, sortBy, searchQuery);
  };

  // Change Genre Filter
  const handleSelectGenre = (genreName: string) => {
    setActiveGenre(genreName);
    setCurrentPage(1);
    updateUrlParams(1, activeTier, genreName, sortBy, searchQuery);
  };

  // Change Sort
  const handleSelectSort = (sortOption: 'trending' | 'popular' | 'new' | 'duration') => {
    setSortBy(sortOption);
    setCurrentPage(1);
    updateUrlParams(1, activeTier, activeGenre, sortOption, searchQuery);
  };

  // Change Page Slot Number
  const handleJumpToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    updateUrlParams(pageNumber, activeTier, activeGenre, sortBy, searchQuery);
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic available categories
  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    (categories || []).forEach((c) => {
      if (c?.name) list.add(c.name.trim());
    });
    allMovies.forEach((m) => {
      (m.genres || []).forEach((g) => {
        if (g) list.add(g.trim());
      });
    });
    return Array.from(list).filter(Boolean);
  }, [categories, allMovies]);

  // Filtered & Sorted Movie List
  const filteredMovies = useMemo(() => {
    let list = [...allMovies];

    // 1. Tier Filter
    if (activeTier !== 'all') {
      list = list.filter((m) => (m.tier || 'regular').toLowerCase() === activeTier.toLowerCase());
    }

    // 2. Genre Filter
    if (activeGenre !== 'all') {
      const gLower = activeGenre.toLowerCase().trim();
      list = list.filter((m) =>
        (m.genres || []).some(
          (g) => (g || '').toLowerCase().trim() === gLower || (g || '').toLowerCase().includes(gLower)
        )
      );
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.genres || []).some((g) => (g || '').toLowerCase().includes(q)) ||
          (m.overview && m.overview.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'new':
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'duration':
        list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'trending':
      default:
        break;
    }

    return list;
  }, [allMovies, activeTier, activeGenre, searchQuery, sortBy]);

  // Pagination Calculation (Max 20 Items per Slot)
  const totalItems = filteredMovies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentSlotVideos = filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Generate numbered slot items (1, 2, 3, 4, 5...)
  const pageSlots = useMemo(() => {
    const slots: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) slots.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        slots.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        slots.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        slots.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return slots;
  }, [totalPages, safeCurrentPage]);

  const renderTierIcon = (iconType: string) => {
    switch (iconType) {
      case 'crown':
        return <IconCrown className="w-3.5 h-3.5 text-amber-400" />;
      case 'diamond':
        return <IconDiamond className="w-3.5 h-3.5 text-cyan-400" />;
      case 'star':
        return <IconStar className="w-3.5 h-3.5 text-purple-400" />;
      case 'user':
        return <IconUser className="w-3.5 h-3.5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div ref={galleryRef} className="relative min-h-screen pt-20 pb-20 select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Area with Ad Wings */}
      <div className="relative mx-auto max-w-[1720px] px-2 sm:px-4 lg:px-8 flex justify-center items-start gap-4 lg:gap-8">
        {/* Left Side Ad Wing */}
        <SideAdSlot position="left" />

        {/* Center Gallery Column */}
        <div className="flex-1 max-w-7xl min-w-0 space-y-6">
          {/* Header & Breadcrumb */}
          <div className="pt-4 pb-2 border-b border-border/30 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-brand/20 border border-brand/40 text-brand text-[10px] font-black uppercase tracking-wider">
                  Galeri Video
                </span>
                <span className="text-xs text-text-muted">
                  Maksimal 20 Video / Slot Halaman
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Semua Koleksi Video
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Pilih urutan slot angka di bawah untuk melihat koleksi video lainnya.
              </p>
            </div>

            {/* Total Indicator */}
            <div className="text-left md:text-right text-xs text-zinc-400">
              <span>Menampilkan </span>
              <strong className="text-white">
                {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
              </strong>
              <span> dari </span>
              <strong className="text-brand font-bold">{totalItems} Video</strong>
            </div>
          </div>

          {/* Filter Bar: Tier, Categories, Search, Sort */}
          <div className="space-y-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 sm:p-5">
            {/* Top Row: Tier Tabs + Search & Sort */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Tier Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {TIER_OPTIONS.map((tg) => {
                  const isSelected = activeTier === tg.id;
                  return (
                    <button
                      key={tg.id}
                      onClick={() => handleSelectTier(tg.id)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-brand text-white border-brand shadow-lg shadow-brand/25'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      )}
                    >
                      {tg.iconType !== 'all' && renderTierIcon(tg.iconType)}
                      <span>{tg.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-black/40 text-white/90">
                        {tg.id === 'all'
                          ? allMovies.length
                          : allMovies.filter((m) => (m.tier || 'regular') === tg.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                      updateUrlParams(1, activeTier, activeGenre, sortBy, e.target.value);
                    }}
                    placeholder="Cari judul / tag..."
                    className="h-9 pl-8 pr-7 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-brand text-xs text-white placeholder-zinc-500 focus:outline-none transition-all w-40 sm:w-52"
                  />
                  <svg className="w-3.5 h-3.5 absolute left-2.5 top-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        updateUrlParams(1, activeTier, activeGenre, sortBy, '');
                      }}
                      className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSelectSort(e.target.value as any)}
                  className="h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="trending">🔥 Trending</option>
                  <option value="popular">⭐ Rating Tertinggi</option>
                  <option value="new">✨ Rilis Terbaru</option>
                  <option value="duration">⏳ Durasi Terpanjang</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Category / Genre Filter Chips */}
            {availableCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-800/60 scrollbar-none">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap shrink-0">
                  Genre:
                </span>

                <button
                  onClick={() => handleSelectGenre('all')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                    activeGenre === 'all'
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  Semua Genre
                </button>

                {availableCategories.map((catName) => {
                  const isCatSelected = activeGenre.toLowerCase() === catName.toLowerCase();
                  return (
                    <button
                      key={catName}
                      onClick={() => handleSelectGenre(catName)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                        isCatSelected
                          ? 'bg-white/20 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      )}
                    >
                      {catName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Video Gallery Grid */}
          <div className="pt-2">
            {currentSlotVideos.length === 0 ? (
              <EmptyState
                icon="🎬"
                message="Tidak ada video yang cocok dengan filter atau pencarian Anda."
                action={
                  <button
                    onClick={() => {
                      setActiveTier('all');
                      setActiveGenre('all');
                      setSearchQuery('');
                      setCurrentPage(1);
                      setSearchParams({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-all cursor-pointer shadow-lg shadow-brand/25"
                  >
                    Reset Semua Filter
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                {currentSlotVideos.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>

          {/* Numbered Pagination Slot Mode (Mode Urutan Slot Angka) */}
          {totalPages > 1 && (
            <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800">
              {/* Slot Counter info */}
              <div className="text-xs text-zinc-400">
                Slot Halaman <strong className="text-white">{safeCurrentPage}</strong> dari{' '}
                <strong className="text-white">{totalPages}</strong>
              </div>

              {/* Numbered Slot Buttons Row */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* Prev Button */}
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => handleJumpToPage(safeCurrentPage - 1)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1',
                    safeCurrentPage <= 1
                      ? 'opacity-40 border-zinc-800 text-zinc-600 pointer-events-none'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                  )}
                  aria-label="Slot Sebelumnya"
                >
                  <span>‹</span>
                  <span>Sebelumnya</span>
                </button>

                {/* Numbered Page Slot Buttons */}
                {pageSlots.map((slot, idx) => {
                  if (slot === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs font-bold text-zinc-500">
                        ...
                      </span>
                    );
                  }

                  const pageNum = Number(slot);
                  const isCurrent = safeCurrentPage === pageNum;

                  return (
                    <button
                      key={`slot-${pageNum}`}
                      onClick={() => handleJumpToPage(pageNum)}
                      className={cn(
                        'min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-mono shadow-sm',
                        isCurrent
                          ? 'bg-brand text-white border border-brand shadow-md shadow-brand/30 scale-105'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
                      )}
                      title={`Buka Slot Halaman #${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => handleJumpToPage(safeCurrentPage + 1)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1',
                    safeCurrentPage >= totalPages
                      ? 'opacity-40 border-zinc-800 text-zinc-600 pointer-events-none'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                  )}
                  aria-label="Slot Berikutnya"
                >
                  <span>Berikutnya</span>
                  <span>›</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Ad Wing */}
        <SideAdSlot position="right" />
      </div>
    </div>
  );
}
