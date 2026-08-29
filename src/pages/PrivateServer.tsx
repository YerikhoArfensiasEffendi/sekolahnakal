/**
 * Halaman Private Server Streaming Eksklusif 18+
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur Unggulan:
 * - Full-Width Edge-to-Edge Grid (Mepet Kanan-Kiri Bebas Iklan Sayap)
 * - Pagination Slide / Halaman: Maksimal 20 Video per Halaman (1, 2, 3, 4, ...)
 * - Dedicated High-Bitrate Private Video Nodes
 * - Filter multi-dimensi (Tier, Kategori Spesifik, Live Search, Sort by Rating/Newest/Duration)
 * - Indikator status node server & tier member aktif
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { movieStore } from '@/services/movieStore.service';
import { categoryStore } from '@/services/categoryStore.service';
import { useAuth } from '@/contexts/AuthContext';
import { getTierBadgeConfig } from '@/utils/tier';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
} from '@/components/icons';

const ITEMS_PER_PAGE = 20;

// Tier definitions
const TIER_GROUPS = [
  {
    id: 'all',
    label: 'Semua Private Nodes',
    shortLabel: 'Semua Node',
    iconType: 'all',
    color: 'text-white',
    badgeClass: 'bg-white/10 text-white border-white/20',
    description: 'Seluruh katalog video dari semua node private server.',
  },
  {
    id: 'vvip',
    label: 'EXCLUSIF VVIP VAULT',
    shortLabel: 'VVIP Vault',
    iconType: 'crown',
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Master raw footage, edisi 4K uncensored tanpa sensor kualitas tertinggi.',
  },
  {
    id: 'vip',
    label: 'EXCLUSIF VIP STUDIO',
    shortLabel: 'VIP Studio',
    iconType: 'star',
    color: 'text-purple-400',
    badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Serial cosplay roleplay, sinematik Asia & JAV style beresolusi tinggi.',
  },
  {
    id: 'regular',
    label: 'REGULER STREAM',
    shortLabel: 'Reguler',
    iconType: 'user',
    color: 'text-gray-300',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Koleksi video publik yang dapat diakses bebas oleh semua murid.',
  },
];

export default function PrivateServer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTier = searchParams.get('tier') || 'all';
  const urlGenre = searchParams.get('genre') || 'all';

  const { tier: userTier } = useAuth();
  const userTierConfig = getTierBadgeConfig(userTier);

  const [activeTier, setActiveTier] = useState<string>(urlTier);
  const [activeGenre, setActiveGenre] = useState<string>(urlGenre);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'trending' | 'popular' | 'new' | 'duration'>('trending');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allMovies, setAllMovies] = useState<Movie[]>(() => movieStore.getAll());
  const [categories, setCategories] = useState(() => categoryStore.getAll());

  const gridTopRef = useRef<HTMLDivElement>(null);

  // Listen to live database updates & initial server fetch
  useEffect(() => {
    movieStore.refreshFromServer().then((movies) => {
      if (movies && movies.length > 0) setAllMovies(movies);
    });
    categoryStore.refreshFromServer().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });

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
    const t = searchParams.get('tier');
    if (t) setActiveTier(t);
    const g = searchParams.get('genre');
    if (g) setActiveGenre(g);
  }, [searchParams]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTier, activeGenre, searchQuery, sortBy]);

  // Handle tier selection
  const handleSelectTier = (tierId: string) => {
    setActiveTier(tierId);
    setActiveGenre('all');
    const newParams: Record<string, string> = {};
    if (tierId !== 'all') newParams.tier = tierId;
    setSearchParams(newParams);
  };

  // Handle genre selection
  const handleSelectGenre = (genreName: string) => {
    setActiveGenre(genreName);
    const newParams: Record<string, string> = {};
    if (activeTier !== 'all') newParams.tier = activeTier;
    if (genreName !== 'all') newParams.genre = genreName;
    setSearchParams(newParams);
  };

  // Determine available categories dynamically from real data only
  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    (categories || []).forEach((c) => {
      if (c?.name && typeof c.name === 'string') list.add(c.name.trim());
    });

    const targetMovies =
      activeTier === 'all'
        ? allMovies
        : allMovies.filter((m) => (m.tier || 'regular').toLowerCase() === activeTier.toLowerCase());

    targetMovies.forEach((m) => {
      (m.genres || []).forEach((g) => {
        if (g && typeof g === 'string') list.add(g.trim());
      });
    });

    return Array.from(list).filter(Boolean);
  }, [activeTier, categories, allMovies]);

  // Filtered & Sorted Movie List
  const filteredMovies = useMemo(() => {
    let list = [...allMovies];

    // 1. Filter Tier
    if (activeTier !== 'all') {
      list = list.filter((m) => (m.tier || 'regular').toLowerCase() === activeTier.toLowerCase());
    }

    // 2. Filter Category / Genre
    if (activeGenre !== 'all') {
      const gLower = activeGenre.toLowerCase().trim();
      list = list.filter((m) =>
        (m.genres || []).some(
          (g) => (g || '').toLowerCase().trim() === gLower || (g || '').toLowerCase().includes(gLower)
        )
      );
    }

    // 3. Filter Search Query
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
        // Default order
        break;
    }

    return list;
  }, [allMovies, activeTier, activeGenre, searchQuery, sortBy]);

  // Pagination calculations (Max 20 per page)
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / ITEMS_PER_PAGE));
  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMovies, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <div className="relative min-h-screen pt-16 sm:pt-20 pb-16 select-none">
      {/* Subtle ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Full-Width Edge-to-Edge Content Container */}
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Header Section: Editorial Typography */}
        <div ref={gridTopRef} className="pt-2 pb-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Private Server
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
              Akses video eksklusif multi-resolusi langsung dari cloud storage privat.
            </p>
          </div>

          {/* Member Active Status Info */}
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
            <span className="text-[10px] text-zinc-500 font-medium">Akses:</span>
            <div className="flex items-center gap-1.5">
              {renderTierIcon(userTierConfig.iconType)}
              <span className="text-xs font-bold text-white">{userTierConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Navigation Bar: Minimalist Tier Tabs & Controls */}
        <div className="space-y-3">
          {/* Top Row: Tier Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {TIER_GROUPS.map((tg) => {
              const isSelected = activeTier === tg.id;
              const count = tg.id === 'all'
                ? allMovies.length
                : allMovies.filter((m) => (m.tier || 'regular') === tg.id).length;

              return (
                <button
                  key={tg.id}
                  onClick={() => handleSelectTier(tg.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shadow-sm shrink-0',
                    isSelected
                      ? 'bg-white text-black border-white font-bold shadow-md'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  {tg.iconType !== 'all' && renderTierIcon(tg.iconType)}
                  <span>{tg.shortLabel}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isSelected ? 'bg-black/15 text-black' : 'bg-white/10 text-zinc-400'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls (Compact Side-by-Side on Mobile) */}
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari video di server..."
                className="w-full h-8 sm:h-9 pl-7 pr-6 rounded-full bg-zinc-900/80 hover:bg-zinc-900 focus:bg-zinc-900 border border-white/10 focus:border-cyan-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 sm:top-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 sm:top-2.5 text-zinc-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 text-xs text-zinc-300 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="trending" className="bg-zinc-900">🔥 Trending</option>
              <option value="popular" className="bg-zinc-900">⭐ Rating</option>
              <option value="new" className="bg-zinc-900">✨ Terbaru</option>
              <option value="duration" className="bg-zinc-900">⏳ Durasi</option>
            </select>
          </div>

          {/* Seamless Horizontal Category Tags */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-1 scrollbar-none -mx-1 px-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap shrink-0 pr-1">
                Kategori:
              </span>

              <button
                onClick={() => handleSelectGenre('all')}
                className={cn(
                  'px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                  activeGenre === 'all'
                    ? 'bg-brand text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                Semua
              </button>

              {availableCategories.map((catName) => {
                const isCatSelected = activeGenre.toLowerCase() === catName.toLowerCase();
                return (
                  <button
                    key={catName}
                    onClick={() => handleSelectGenre(catName)}
                    className={cn(
                      'px-2.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0',
                      isCatSelected
                        ? 'bg-brand text-white font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Grid Presentation */}
        <div className="pt-1">
          {filteredMovies.length === 0 ? (
            <EmptyState
              icon="🎬"
              message={`Belum ada video pada kategori "${activeGenre}".`}
              action={
                <button
                  onClick={() => {
                    setActiveTier('all');
                    setActiveGenre('all');
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow"
                >
                  Reset Semua Filter
                </button>
              }
            />
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Paginated 20 Video Grid */}
              <MovieGrid movies={paginatedMovies} />

              {/* Numbered Pagination Slide (1, 2, 3, 4, ...) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-white/5">
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-mono text-center sm:text-left">
                    Menampilkan <strong className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMovies.length)}</strong> dari <strong className="text-white">{filteredMovies.length}</strong> total video
                  </p>

                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      ‹
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = pageNum === currentPage;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              'h-7 sm:h-8 min-w-[28px] sm:min-w-[32px] px-1.5 sm:px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border',
                              isActive
                                ? 'bg-brand text-white border-brand shadow-lg scale-105'
                                : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        (pageNum === currentPage - 2 && pageNum > 1) ||
                        (pageNum === currentPage + 2 && pageNum < totalPages)
                      ) {
                        return (
                          <span key={pageNum} className="px-0.5 text-zinc-600 font-mono text-[10px]">
                            ..
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
