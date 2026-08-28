/**
 * Halaman Private Server Streaming Eksklusif 18+
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur Unggulan:
 * - Dedicated High-Bitrate Private Video Nodes
 * - Akses kategori lengkap per Tier (VVIP Vault, VIP Studio, Talent Showcase, Reguler)
 * - Filter multi-dimensi (Tier, Kategori Spesifik, Live Search, Sort by Rating/Newest/Duration)
 * - Indikator status node server & tier member aktif
 * - Sayap banner iklan terintegrasi
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Movie } from '@/types/movie';
import { movieStore } from '@/services/movieStore.service';
import { categoryStore } from '@/services/categoryStore.service';
import { useAuth } from '@/contexts/AuthContext';
import { getTierBadgeConfig } from '@/utils/tier';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
} from '@/components/icons';

// Tier definitions with dedicated categories mapping
const TIER_GROUPS = [
  {
    id: 'all',
    label: 'Semua Private Nodes',
    shortLabel: 'Semua Node',
    iconType: 'all',
    color: 'text-white',
    badgeClass: 'bg-white/10 text-white border-white/20',
    description: 'Seluruh katalog video dari semua node private server.',
    categories: [],
  },
  {
    id: 'vvip',
    label: 'EXCLUSIF VVIP VAULT',
    shortLabel: 'VVIP Vault',
    iconType: 'crown',
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Master raw footage, edisi 4K uncensored tanpa sensor kualitas tertinggi.',
    categories: [
      'Uncensored Cut',
      'Eksklusif VVIP',
      'Private Affair',
      'Director’s Cut',
      'Master High Bitrate',
      'Romance & Sensual',
    ],
  },
  {
    id: 'vip',
    label: 'EXCLUSIF VIP STUDIO',
    shortLabel: 'VIP Studio',
    iconType: 'star',
    color: 'text-purple-400',
    badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Serial cosplay roleplay, sinematik Asia & JAV style beresolusi tinggi.',
    categories: [
      'Cosplay & Roleplay',
      'Asian & JAV Style',
      'Western & Premiere',
      'Late Night Affair',
      'Drama Dewasa',
      'Sensual Fantasy',
    ],
  },
  {
    id: 'regular',
    label: 'REGULER STREAM',
    shortLabel: 'Reguler',
    iconType: 'user',
    color: 'text-gray-300',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Koleksi video publik yang dapat diakses bebas oleh semua murid.',
    categories: [
      'Romance & Sensual',
      'Drama Dewasa',
      'Indie Short',
      'Teaser & Trailer',
      'Umum',
    ],
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
    const t = searchParams.get('tier');
    if (t) setActiveTier(t);
    const g = searchParams.get('genre');
    if (g) setActiveGenre(g);
  }, [searchParams]);

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

  // Determine available categories for the active tier
  const currentTierGroup = TIER_GROUPS.find((g) => g.id === activeTier) || TIER_GROUPS[0]!;
  const availableCategories = useMemo(() => {
    if (activeTier === 'all') {
      return (categories || []).map((c) => c.name);
    }
    // Combine group predefined categories with server categories matching the tier
    const list = new Set<string>(currentTierGroup.categories);
    allMovies
      .filter((m) => (m.tier || 'regular').toLowerCase() === activeTier.toLowerCase())
      .forEach((m) => {
        (m.genres || []).forEach((g) => {
          if (g && typeof g === 'string') list.add(g.trim());
        });
      });
    return Array.from(list);
  }, [activeTier, categories, allMovies, currentTierGroup]);

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
    <div className="relative min-h-screen pt-20 pb-20">
      {/* Subtle ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Area with Ad Wings */}
      <div className="relative mx-auto max-w-[1720px] px-3 sm:px-6 lg:px-8 flex justify-center items-start gap-4 lg:gap-8">
        {/* Left Side Ad Wing */}
        <SideAdSlot position="left" />

        {/* Center Content Column (Seamless, Human-Crafted Layout) */}
        <div className="flex-1 max-w-6xl min-w-0 space-y-8">
          {/* Header Section: Editorial Typography */}
          <div className="pt-4 pb-2 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Private Server
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Akses video eksklusif multi-resolusi berkecepatan tinggi langsung dari cloud storage privat tanpa limit.
              </p>
            </div>

            {/* Member Active Status Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] text-zinc-500 font-medium">Hak Akses Anda</p>
                <div className="flex items-center gap-1.5 justify-end">
                  {renderTierIcon(userTierConfig.iconType)}
                  <span className="text-xs font-bold text-white">{userTierConfig.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar: Minimalist Tier Tabs & Controls */}
          <div className="space-y-4">
            {/* Top Row: Tier Tabs + Search & Sort */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Seamless Pill Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {TIER_GROUPS.map((tg) => {
                  const isSelected = activeTier === tg.id;
                  return (
                    <button
                      key={tg.id}
                      onClick={() => handleSelectTier(tg.id)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                        isSelected
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {tg.iconType !== 'all' && renderTierIcon(tg.iconType)}
                      <span>{tg.shortLabel}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                        isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-zinc-400'
                      )}>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari di server..."
                    className="h-8 pl-7 pr-6 rounded-full bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all w-36 sm:w-44"
                  />
                  <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-zinc-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="trending" className="bg-zinc-900">🔥 Trending</option>
                  <option value="popular" className="bg-zinc-900">⭐ Rating Tertinggi</option>
                  <option value="new" className="bg-zinc-900">✨ Terbaru</option>
                  <option value="duration" className="bg-zinc-900">⏳ Durasi</option>
                </select>
              </div>
            </div>

            {/* Seamless Horizontal Category Tags (No heavy box) */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-2 scrollbar-none">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap shrink-0">
                Kategori:
              </span>

              <button
                onClick={() => handleSelectGenre('all')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                  activeGenre === 'all'
                    ? 'bg-brand text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                Semua Kategori
              </button>

              {availableCategories.map((catName) => {
                const isCatSelected = activeGenre.toLowerCase() === catName.toLowerCase();
                return (
                  <button
                    key={catName}
                    onClick={() => handleSelectGenre(catName)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
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
          </div>

          {/* Video Grid Presentation */}
          <div className="pt-2">
            {filteredMovies.length === 0 ? (
              <EmptyState
                icon="🎬"
                message={`Belum ada video pada node ${currentTierGroup.label} dengan filter kategori "${activeGenre}".`}
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
              <MovieGrid movies={filteredMovies} />
            )}
          </div>
        </div>

        {/* Right Side Ad Wing */}
        <SideAdSlot position="right" />
      </div>
    </div>
  );
}
