/**
 * Halaman Pencarian Video Streaming dengan Sistem Filter Komprehensif
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Pencarian teks instan (Judul, Genre, Sinopsis, Kreator)
 * - Sistem Filter Multi-Kriteria (Tier, Kategori/Genre, Durasi, Minimal Rating)
 * - Pengurutan Multi-Opsi (Trending, Rating Tertinggi, Rilis Terbaru, Durasi)
 * - Panel Filter Drawer Interaktif dengan Active Filter Chips & Reset Instan
 * - Desain Human-Style Editorial tanpa card/box berlebih
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieStore } from '@/services/movieStore.service';
import { useDebounce } from '@/hooks/useDebounce';
import { categoryStore } from '@/services/categoryStore.service';
import type { Genre } from '@/constants/genres';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { cn } from '@/utils/cn';
import { IconCrown, IconStar, IconDiamond, IconUser } from '@/components/icons';

const TIER_FILTERS = [
  { id: 'all', label: 'Semua Tier', iconType: 'all' },
  { id: 'regular', label: 'REGULER', iconType: 'user' },
  { id: 'vvip', label: 'EXCLUSIF VVIP', iconType: 'crown' },
  { id: 'vip', label: 'EXCLUSIF VIP', iconType: 'star' },
  { id: 'talent', label: 'EXCLUSIF TALENT', iconType: 'diamond' },
];

const DURATION_FILTERS = [
  { id: 'all', label: 'Semua Durasi' },
  { id: 'short', label: '⚡ Pendek (< 15 mnt)' },
  { id: 'medium', label: '🎬 Sedang (15 - 60 mnt)' },
  { id: 'long', label: '⏳ Panjang (> 60 mnt)' },
];

const RATING_FILTERS = [
  { id: 'all', label: 'Semua Rating' },
  { id: '8', label: '★ 8.0+' },
  { id: '9', label: '★ 9.0+' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialTier = searchParams.get('tier') ?? 'all';
  const initialGenre = searchParams.get('genre') ?? 'all';
  const initialSort = searchParams.get('sort') ?? 'trending';
  const initialDuration = searchParams.get('duration') ?? 'all';
  const initialMinRating = searchParams.get('minRating') ?? 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedTier, setSelectedTier] = useState<string>(initialTier);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialGenre);
  const [selectedDuration, setSelectedDuration] = useState<string>(initialDuration);
  const [selectedMinRating, setSelectedMinRating] = useState<string>(initialMinRating);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  const [categories, setCategories] = useState<Genre[]>(() => categoryStore.getAll());
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    const handleUpdate = () => setCategories(categoryStore.getAll());
    window.addEventListener('sekolah_nakal_categories_updated', handleUpdate);
    return () => window.removeEventListener('sekolah_nakal_categories_updated', handleUpdate);
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (selectedTier !== 'all') params.tier = selectedTier;
    if (selectedCategory !== 'all') params.genre = selectedCategory;
    if (selectedDuration !== 'all') params.duration = selectedDuration;
    if (selectedMinRating !== 'all') params.minRating = selectedMinRating;
    if (sortBy !== 'trending') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedTier, selectedCategory, selectedDuration, selectedMinRating, sortBy, setSearchParams]);

  // Compute filtered & sorted movies
  const filteredMovies = useMemo(() => {
    let list = [...movieStore.getAll()];

    // 1. Filter by Tier
    if (selectedTier !== 'all') {
      list = list.filter((m) => (m.tier || 'regular').toLowerCase() === selectedTier.toLowerCase());
    }

    // 2. Filter by Search Query
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.genres || []).some((g) => (g || '').toLowerCase().includes(q)) ||
          (m.overview && m.overview.toLowerCase().includes(q))
      );
    }

    // 3. Filter by Category / Genre
    if (selectedCategory !== 'all') {
      const gLower = selectedCategory.toLowerCase().trim();
      list = list.filter((m) =>
        (m.genres || []).some(
          (g) => (g || '').toLowerCase().trim() === gLower || (g || '').toLowerCase().includes(gLower)
        )
      );
    }

    // 4. Filter by Duration
    if (selectedDuration !== 'all') {
      if (selectedDuration === 'short') {
        list = list.filter((m) => (m.duration || 0) < 15);
      } else if (selectedDuration === 'medium') {
        list = list.filter((m) => (m.duration || 0) >= 15 && (m.duration || 0) <= 60);
      } else if (selectedDuration === 'long') {
        list = list.filter((m) => (m.duration || 0) > 60);
      }
    }

    // 5. Filter by Min Rating
    if (selectedMinRating !== 'all') {
      const min = parseFloat(selectedMinRating);
      if (!isNaN(min)) {
        list = list.filter((m) => (m.rating || 0) >= min);
      }
    }

    // 6. Sorting
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'new':
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'duration_desc':
        list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'duration_asc':
        list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'trending':
      default:
        // Default order
        break;
    }

    return list;
  }, [debouncedQuery, selectedTier, selectedCategory, selectedDuration, selectedMinRating, sortBy]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTier !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedDuration !== 'all') count++;
    if (selectedMinRating !== 'all') count++;
    if (sortBy !== 'trending') count++;
    return count;
  }, [selectedTier, selectedCategory, selectedDuration, selectedMinRating, sortBy]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedTier('all');
    setSelectedCategory('all');
    setSelectedDuration('all');
    setSelectedMinRating('all');
    setSortBy('trending');
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
    <div className="relative min-h-screen pt-24 pb-20">
      {/* Subtle ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container with Ad Wings */}
      <div className="relative mx-auto max-w-[1720px] px-3 sm:px-6 lg:px-8 flex justify-center items-start gap-4 lg:gap-8">
        {/* Left Side Ad Wing */}
        <SideAdSlot position="left" />

        {/* Center Content Column */}
        <div className="flex-1 max-w-6xl min-w-0 space-y-8">
          {/* Header & Primary Search Bar */}
          <div className="space-y-4 max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pencarian Video
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Temukan ribuan video eksklusif berdasarkan judul, tier akses, genre, atau durasi.
            </p>

            {/* Seamless Search Input Bar */}
            <div className="relative max-w-2xl mx-auto pt-2">
              <div className="absolute inset-y-0 left-0 pl-4 pt-2 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="search"
                placeholder="Ketik judul video, artis, atau kata kunci..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-white/40 pl-12 pr-10 py-3.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none transition-all shadow-xl"
                aria-label="Pencarian video"
              />

              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 pt-1 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                  aria-label="Hapus kata kunci"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Toolbar System */}
          <div className="space-y-3 pt-2">
            {/* Row 1: Quick Tier Pills & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5">
              {/* Tier Selection Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {TIER_FILTERS.map((tf) => {
                  const isSelected = selectedTier === tf.id;
                  return (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedTier(tf.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                        isSelected
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {renderTierIcon(tf.iconType)}
                      <span>{tf.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Controls: Filter Toggle & Sort Dropdown */}
              <div className="flex items-center gap-2.5 shrink-0 justify-end">
                {/* Advanced Filter Toggle Button */}
                <button
                  onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                    isFilterDrawerOpen || activeFiltersCount > 0
                      ? 'bg-brand/20 text-brand border-brand/50 font-bold'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                  )}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter Lanjutan</span>
                  {activeFiltersCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="trending" className="bg-zinc-900">🔥 Paling Trending</option>
                  <option value="popular" className="bg-zinc-900">⭐ Rating Tertinggi</option>
                  <option value="new" className="bg-zinc-900">✨ Rilis Terbaru</option>
                  <option value="duration_desc" className="bg-zinc-900">⏳ Durasi Terpanjang</option>
                  <option value="duration_asc" className="bg-zinc-900">⚡ Durasi Terpendek</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters Expandable Panel (Smooth Accordion) */}
            {isFilterDrawerOpen && (
              <div className="py-4 space-y-4 border-b border-white/5 animate-fadeIn">
                {/* Category / Genre Filters */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Genre & Kategori:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                        selectedCategory === 'all'
                          ? 'bg-brand text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      Semua Genre
                    </button>
                    {categories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={cn(
                            'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-brand text-white font-bold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration & Rating Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Duration Filter */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Filter Durasi Video:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {DURATION_FILTERS.map((df) => (
                        <button
                          key={df.id}
                          onClick={() => setSelectedDuration(df.id)}
                          className={cn(
                            'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                            selectedDuration === df.id
                              ? 'bg-white text-black font-bold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {df.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Minimal Rating:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {RATING_FILTERS.map((rf) => (
                        <button
                          key={rf.id}
                          onClick={() => setSelectedMinRating(rf.id)}
                          className={cn(
                            'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                            selectedMinRating === rf.id
                              ? 'bg-amber-400 text-black font-bold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {rf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Tag Bar (Breadcrumbs) */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 font-medium">Filter Aktif:</span>

                {selectedTier !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px]">
                    <span>Tier: {selectedTier.toUpperCase()}</span>
                    <button onClick={() => setSelectedTier('all')} className="text-zinc-400 hover:text-white ml-0.5">✕</button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand/20 text-brand text-[11px] font-semibold">
                    <span>Genre: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('all')} className="text-brand/70 hover:text-brand ml-0.5">✕</button>
                  </span>
                )}

                {selectedDuration !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px]">
                    <span>Durasi: {DURATION_FILTERS.find((d) => d.id === selectedDuration)?.label}</span>
                    <button onClick={() => setSelectedDuration('all')} className="text-zinc-400 hover:text-white ml-0.5">✕</button>
                  </span>
                )}

                {selectedMinRating !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-semibold">
                    <span>Rating: ★ {selectedMinRating}.0+</span>
                    <button onClick={() => setSelectedMinRating('all')} className="text-amber-400/70 hover:text-amber-300 ml-0.5">✕</button>
                  </span>
                )}

                {sortBy !== 'trending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[11px]">
                    <span>Sort: {sortBy}</span>
                    <button onClick={() => setSortBy('trending')} className="text-zinc-400 hover:text-white ml-0.5">✕</button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-zinc-400 hover:text-red-400 text-[11px] font-bold ml-1 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}

            {/* Results Header Counter */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-400">
                Menampilkan <strong className="text-white">{filteredMovies.length}</strong> video yang cocok
              </span>
            </div>
          </div>

          {/* Video Grid Results Presentation */}
          <div className="pt-2">
            {filteredMovies.length === 0 ? (
              <EmptyState
                icon="🔍"
                message={
                  query
                    ? `Tidak ada video yang cocok dengan pencarian "${query}".`
                    : `Belum ada video pada kombinasi filter ini.`
                }
                action={
                  <button
                    onClick={handleResetFilters}
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
