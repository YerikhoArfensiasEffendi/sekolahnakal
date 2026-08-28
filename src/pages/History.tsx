import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Movie, WatchProgress } from '@/types/movie';
import { streamingService } from '@/services/streaming.service';
import { movieStore } from '@/services/movieStore.service';
import { MovieRow } from '@/components/movie/MovieRow';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';

export default function History() {
  const [historyMovies, setHistoryMovies] = useState<Movie[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, WatchProgress>>({});
  const { success } = useToast();

  const loadHistory = () => {
    const stored = streamingService.getStoredProgress();
    setProgressMap(stored);
    
    // Urutkan berdasarkan waktu tonton terbaru
    const sortedProgress = Object.values(stored).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const all = movieStore.getAll();
    const movies = sortedProgress
      .map((p) => all.find((m) => m.id === p.movieId))
      .filter((m): m is Movie => m !== undefined);
    setHistoryMovies(movies);
  };

  useEffect(() => {
    loadHistory();
    const handleProgressUpdate = () => loadHistory();
    window.addEventListener('sekolah_nakal_watch_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('sekolah_nakal_watch_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, []);

  const handleClearHistory = () => {
    streamingService.clearHistory();
    setHistoryMovies([]);
    setProgressMap({});
    success('Riwayat tontonan telah dibersihkan');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary">Riwayat Tontonan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Film yang baru-baru ini Anda putar
          </p>
        </div>
        {historyMovies.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-error hover:bg-error/10">
            Hapus Riwayat
          </Button>
        )}
      </div>

      {historyMovies.length === 0 ? (
        <EmptyState
          message="Belum ada riwayat tontonan. Putar film untuk melihat aktivitas Anda di sini."
          icon="📺"
          action={
            <Link to="/browse">
              <Button size="md">Mulai Menonton</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <MovieRow movies={historyMovies} variant="progress" progressMap={progressMap} />
        </div>
      )}
    </div>
  );
}
