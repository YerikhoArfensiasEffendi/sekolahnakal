/**
 * Halaman Jelajahi Film (Browse)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Dinamis: Infinite scroll katalog film dengan filter tier (Reguler teratas) & sayap iklan.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { categoryStore } from '@/services/categoryStore.service';
import type { Genre } from '@/constants/genres';
import { cn } from '@/utils/cn';
import { IconCrown, IconStar, IconDiamond, IconUser } from '@/components/icons';

const TIER_FILTERS = [
  { id: 'all', label: 'Semua Kategori', iconType: 'all' },
  { id: 'regular', label: 'REGULER', iconType: 'user', color: 'text-gray-300' },
  { id: 'vvip', label: 'EXCLUSIF VVIP', iconType: 'crown', color: 'text-amber-300' },
  { id: 'vip', label: 'EXCLUSIF VIP', iconType: 'star', color: 'text-purple-300' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTier = searchParams.get('tier') || 'all';

  const [categories, setCategories] = useState<Genre[]>(categoryStore.getAll());
  const [activeTier, setActiveTier] = useState<string>(urlTier);
  const [activeGenre, setActiveGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trending' | 'popular' | 'new'>('trending');

  useEffect(() => {
    const handleUpdate = () => setCategories(categoryStore.getAll());
    window.addEventListener('sekolah_nakal_categories_updated', handleUpdate);
    return () => window.removeEventListener('sekolah_nakal_categories_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const t = searchParams.get('tier');
    if (t) setActiveTier(t);
  }, [searchParams]);

  const handleSelectTier = (tierId: string) => {
    setActiveTier(tierId);
    if (tierId === 'all') {
      searchParams.delete('tier');
    } else {
      searchParams.set('tier', tierId);
    }
    setSearchParams(searchParams);
  };

  const { items, total, isLoading, sentinelRef } = useInfiniteVideos({
    tier: activeTier,
    genre: activeGenre,
    sortBy,
    limit: 12,
  });

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
    <div className="relative min-h-screen pt-24 pb-16">
      {/* Area Konten Utama & Sayap Iklan */}
      <div className="relative mx-auto max-w-[1720px] px-2 sm:px-4 flex justify-center items-start gap-4 lg:gap-6">
        {/* Sayap Iklan Kiri */}
        <SideAdSlot position="left" />

        {/* Konten Katalog Film */}
        <div className="flex-1 max-w-7xl min-w-0 space-y-6">
          {/* Top Banner: Tier & Category Selector */}
          <div className="space-y-4 pb-4 border-b border-border/30">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Katalog Video Streaming
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                Jelajahi video berdasarkan hak akses tier dan genre.
              </p>
            </div>

            {/* Tier Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {TIER_FILTERS.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => handleSelectTier(tf.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                    activeTier === tf.id
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-bg-surface border-border/60 text-text-secondary hover:text-white hover:bg-bg-hover'
                  )}
                >
                  {renderTierIcon(tf.iconType)}
                  <span>{tf.label}</span>
                </button>
              ))}
            </div>

            {/* Genre Tags Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveGenre('all')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                  activeGenre === 'all'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-text-muted hover:text-white hover:bg-bg-surface'
                )}
              >
                Semua Genre
              </button>
              {categories.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setActiveGenre(genre.name)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                    activeGenre.toLowerCase() === genre.name.toLowerCase()
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-text-muted hover:text-white hover:bg-bg-surface'
                  )}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Counter & Sort By */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              Menampilkan <strong className="text-white">{items.length}</strong> dari{' '}
              <strong className="text-white">{total}</strong> video
            </span>

            <div className="flex items-center gap-2">
              <span>Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'trending' | 'popular' | 'new')}
                className="rounded-md border border-border bg-bg-surface px-2.5 py-1 text-xs font-medium text-white focus:outline-none focus:border-brand"
              >
                <option value="trending">Trending</option>
                <option value="popular">Terpopuler</option>
                <option value="new">Terbaru</option>
              </select>
            </div>
          </div>

          {/* Infinite Movie Grid */}
          {items.length === 0 && !isLoading ? (
            <EmptyState
              message="Tidak ada video yang ditemukan pada filter ini."
              action={
                <button
                  onClick={() => {
                    handleSelectTier('all');
                    setActiveGenre('all');
                  }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Reset Filter
                </button>
              }
            />
          ) : (
            <MovieGrid movies={items} />
          )}

          {/* Infinite Scroll Trigger Sentinel */}
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                <span>Memuat video...</span>
              </div>
            )}
          </div>
        </div>

        {/* Sayap Iklan Kanan */}
        <SideAdSlot position="right" />
      </div>
    </div>
  );
}
