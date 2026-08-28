/**
 * Dynamic Video Discussion & Comments Component (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - 💬 100% Real Komentar Dinamis (Bebas Dummy/Komentar Palsu)
 * - 💾 Tersimpan persisten di database lokal per video
 * - ❤️ Real Likes pada Komentar
 * - 🗑️ Hapus Komentar Sendiri
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';

export interface CommentItem {
  id: string;
  movieId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  timestamp: number;
  likes: number;
  isLiked?: boolean;
}

interface MovieCommentsProps {
  movieId: string;
  movieTitle: string;
}

export function MovieComments({ movieId }: MovieCommentsProps) {
  const { user } = useAuth();
  const { success, info } = useToast();

  const storageKey = `sekolah_nakal_comments_${movieId}`;

  // Ambil hanya komentar riil yang pernah diposting
  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(comments));
    } catch {
      // ignore
    }
  }, [comments, storageKey]);

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const newComment: CommentItem = {
        id: `c-${Date.now()}`,
        movieId,
        userName: user?.name || 'Pengunjung',
        userAvatar: user?.avatarUrl || '',
        text: newCommentText.trim(),
        createdAt: timeStr,
        timestamp: Date.now(),
        likes: 0,
        isLiked: false,
      };

      setComments((prev) => [newComment, ...prev]);
      setNewCommentText('');
      setIsSubmitting(false);
      success('Komentar Anda berhasil diposting!');
    }, 150);
  };

  const handleToggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        }
        return c;
      })
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Hapus komentar Anda?')) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      info('Komentar dihapus');
    }
  };

  return (
    <div className="w-full text-text-primary pt-2">
      {/* Comments Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/30 mb-5">
        <h2 className="text-base sm:text-lg font-bold text-white">Diskusi & Komentar</h2>
        <span className="text-xs text-text-muted font-bold px-2 py-0.5 rounded-md bg-bg-surface border border-border/40">
          {comments.length} Komentar
        </span>
      </div>

      {/* Post New Comment Inline Form */}
      <form onSubmit={handleAddComment} className="mb-6 space-y-3 pb-5 border-b border-border/25">
        <div className="flex gap-3 items-start">
          {/* User Avatar */}
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover shrink-0 border border-border/60"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex-1 space-y-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Tulis komentar atau ulasan Anda tentang video ini..."
              className="w-full rounded-xl bg-bg-surface/60 border border-border/60 focus:border-brand p-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-2">
              {newCommentText && (
                <button
                  type="button"
                  onClick={() => setNewCommentText('')}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                isLoading={isSubmitting}
                disabled={!newCommentText.trim()}
                className="px-4 font-bold text-xs rounded-xl"
              >
                Kirim Komentar
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-bg-surface/30 border border-border/20 space-y-1.5">
          <div className="text-2xl">💬</div>
          <p className="text-xs font-bold text-white">Belum Ada Komentar</p>
          <p className="text-[11px] text-text-muted">
            Jadilah yang pertama memberikan ulasan dan tanggapan untuk video ini!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-xl bg-bg-surface/40 border border-border/30 group hover:border-border/60 transition-colors"
            >
              {/* Commenter Avatar */}
              {comment.userAvatar ? (
                <img
                  src={comment.userAvatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover shrink-0 border border-border/40"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-text-secondary border border-border/40">
                  {comment.userName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Comment Body */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{comment.userName}</span>
                    <span className="text-[10px] text-text-muted font-mono">{comment.createdAt}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                    title="Hapus Komentar"
                  >
                    🗑️
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-0.5 break-words">
                  {comment.text}
                </p>

                {/* Actions: Like button */}
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <button
                    onClick={() => handleToggleLike(comment.id)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      comment.isLiked
                        ? 'text-brand font-bold'
                        : 'text-text-muted hover:text-white'
                    }`}
                    aria-label="Sukai komentar"
                  >
                    <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                    <span className="text-[10px] font-bold">{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
