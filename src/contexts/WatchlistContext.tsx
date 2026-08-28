import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Movie } from '@/types/movie';
import { watchlistService } from '@/services/watchlist.service';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface WatchlistContextValue {
  watchlist: Movie[];
  isLoading: boolean;
  isInWatchlist: (movieId: string) => boolean;
  toggleWatchlist: (movie: Movie) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, info } = useToast();
  const { isAuthenticated } = useAuth();

  const refreshWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist, isAuthenticated]);

  const isInWatchlist = useCallback(
    (movieId: string) => {
      return watchlist.some((m) => m.id === movieId);
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    async (movie: Movie): Promise<boolean> => {
      const exists = watchlist.some((m) => m.id === movie.id);

      // Optimistic UI update
      if (exists) {
        setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
        info(`"${movie.title}" dihapus dari daftar tontonan`);
      } else {
        setWatchlist((prev) => [...prev, movie]);
        success(`"${movie.title}" ditambahkan ke daftar tontonan`);
      }

      try {
        const res = await watchlistService.toggleWatchlist(movie.id);
        return res.added;
      } catch {
        // Rollback on error
        await refreshWatchlist();
        return exists;
      }
    },
    [watchlist, success, info, refreshWatchlist]
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        isInWatchlist,
        toggleWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
