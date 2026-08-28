import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie } from '@/types/movie';
import { queryVideoCatalog, type VideoCatalogQuery } from '@/lib/videoCatalog';

export function useInfiniteVideos(query: Omit<VideoCatalogQuery, 'page'>) {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    const res = queryVideoCatalog({ ...query, page: 1 });
    setItems(res.items);
    setTotal(res.total);
    setHasMore(res.hasMore);
    setIsLoading(false);
  }, [query.genre, query.tier, query.search, query.sortBy, query.limit]);

  // Load next chunk
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const nextPage = page + 1;
    const res = queryVideoCatalog({ ...query, page: nextPage });

    setItems((prev) => [...prev, ...res.items]);
    setPage(nextPage);
    setHasMore(res.hasMore);
    setIsLoading(false);
  }, [isLoading, hasMore, page, query]);

  // Sentinel ref for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px' } // Pre-fetch before user reaches the very bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return {
    items,
    total,
    isLoading,
    hasMore,
    sentinelRef,
    loadMore,
  };
}
