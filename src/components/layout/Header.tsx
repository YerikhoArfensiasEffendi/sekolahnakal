import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';
import { env } from '@/config/env';
import { ROUTES, watchPath } from '@/constants/routes';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL, hasUploadAccessFromRoles } from '@/utils/tier';
import { IconCrown, IconStar, IconDiamond, IconLogout, IconDiscord, IconTelegram } from '@/components/icons';
import { movieStore } from '@/services/movieStore.service';

const NAV_LINKS = [
  { label: 'Beranda', to: ROUTES.HOME },
  { label: 'Semua Video', to: ROUTES.GALLERY },
  { label: 'Private Server', to: ROUTES.PRIVATE_SERVER, badge: 'VIP' },
  { label: 'Exclusive Information', to: ROUTES.EXCLUSIVE_INFO, badge: '🔥 INFO' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { user, tier, discordAccount, isAuthenticated, logout } = useAuth();
  const { lock } = useSiteGate();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const tierConfig = getTierBadgeConfig(tier);
  const hasUploadAccess = hasUploadAccessFromRoles(discordAccount?.roles);

  // Live matching movies for instant search dropdown
  const liveResults = searchQuery.trim()
    ? movieStore.getAll().filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          (m.title || '').toLowerCase().includes(q) ||
          (m.genres || []).some((g) => (g || '').toLowerCase().includes(q)) ||
          (m.overview && m.overview.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus and search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectResult = (movieId: string) => {
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    navigate(watchPath(movieId));
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-colors duration-300',
        isScrolled
          ? 'bg-bg-primary/95 shadow-xl backdrop-blur-md border-b border-border/40'
          : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent'
      )}
    >
      <nav className="w-full flex h-16 items-center justify-between px-2 sm:px-4 lg:px-6">
        {/* Mobile Full Search Input Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 z-50 flex items-center bg-bg-primary px-3 gap-2"
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik judul, genre, atau artis..."
                    className="w-full h-10 pl-9 pr-8 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-brand"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-full bg-brand text-white text-xs font-bold"
                >
                  Cari
                </button>
              </form>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo & Desktop Nav Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/images/logo.png" alt={env.APP_NAME} className="h-9 w-auto object-contain" />
            <span className="hidden text-xl font-black tracking-tight text-white sm:block">
              {env.APP_NAME}
            </span>
            <span className="bg-red-600/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider">
              18+
            </span>
          </Link>

          {!isMobile && (
            <div className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-semibold transition-colors flex items-center gap-1.5',
                      isActive ? 'text-white font-bold text-brand' : 'text-text-secondary hover:text-white'
                    )
                  }
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Icons, Interactive Search & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Live Search Input (Desktop & Tablet) */}
          <div ref={searchContainerRef} className="relative hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Cari video..."
                className="h-8 pl-8 pr-7 rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-brand text-xs text-white placeholder-zinc-400 focus:outline-none transition-all duration-200 w-36 md:w-56 lg:focus:w-72"
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-400 hover:text-white text-[11px] p-0.5"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Live Autocomplete Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#121212]/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-2 z-50 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 border-b border-zinc-800 flex justify-between">
                    <span>Hasil Pencarian Cepat</span>
                    <span>{liveResults.length} Video</span>
                  </div>

                  {liveResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      Tidak ditemukan video untuk "{searchQuery}"
                    </div>
                  ) : (
                    liveResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleSelectResult(movie.id)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <img
                          src={movie.backdropUrl || movie.posterUrl || '/images/logo.png'}
                          alt={movie.title}
                          className="h-10 w-14 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-brand transition-colors">
                            {movie.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-amber-400 font-semibold">★ {movie.rating || 0}</span>
                            <span className="text-[10px] text-zinc-500">•</span>
                            <span className="text-[10px] text-zinc-400 truncate">
                              {(movie.genres || []).slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full text-center py-2 mt-1 rounded-lg bg-brand/20 hover:bg-brand text-brand hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Lihat Semua Hasil di Halaman Pencarian →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Search Trigger Button */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(true);
              setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
            }}
            className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Buka Pencarian"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Discord Server Link */}
          <a
            href={DISCORD_BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
            aria-label="Server Discord Resmi"
            title="Gabung Server Discord"
          >
            <IconDiscord className="w-4 h-4" />
          </a>

          {/* Telegram Channel Link */}
          <a
            href={TELEGRAM_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-[#229ED9] hover:bg-[#229ED9]/10 transition-colors"
            aria-label="Channel Telegram Resmi"
            title="Gabung Channel Telegram"
          >
            <IconTelegram className="w-4 h-4" />
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/watchlist"
                className="hidden sm:inline-block text-sm font-semibold text-text-secondary transition-colors hover:text-white"
              >
                Daftar Saya
              </Link>

              {/* User Dropdown */}
              <div ref={dropdownRef} className="relative flex items-center gap-2">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-full focus-visible:outline-brand ring-2 ring-transparent hover:ring-brand transition-all p-0.5"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu pengguna"
                >
                  <div className="relative">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {tier !== 'regular' && (
                      <span className="absolute -bottom-1 -right-1 flex items-center justify-center h-3.5 w-3.5 rounded bg-black border border-border">
                        {tierConfig.iconType === 'crown' && <IconCrown className="w-2.5 h-2.5 text-amber-400" />}
                        {tierConfig.iconType === 'star' && <IconStar className="w-2.5 h-2.5 text-purple-400" />}
                        {tierConfig.iconType === 'diamond' && <IconDiamond className="w-2.5 h-2.5 text-cyan-400" />}
                      </span>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg-surface/95 backdrop-blur-xl border border-border/80 p-2 shadow-2xl z-50 space-y-0.5"
                    >
                      <div className="px-3 py-2 border-b border-border/30 mb-1 space-y-1">
                        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 ${tierConfig.badgeClass}`}
                          >
                            {tierConfig.iconType === 'crown' && <IconCrown className="w-3 h-3" />}
                            {tierConfig.iconType === 'star' && <IconStar className="w-3 h-3" />}
                            {tierConfig.iconType === 'diamond' && <IconDiamond className="w-3 h-3" />}
                            <span>{tierConfig.label}</span>
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        Profil Akun
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        Daftar Tontonan
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        Riwayat Nonton
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        Pengaturan
                      </Link>

                      {hasUploadAccess && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                        >
                          <span>🎬 Studio Kreator / Upload</span>
                        </Link>
                      )}

                      <div className="border-t border-border/30 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            lock();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <IconLogout className="w-3.5 h-3.5" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-all hover:bg-brand-hover shadow-md shadow-brand/20"
            >
              Masuk
            </Link>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-1 p-2 text-text-primary rounded-lg hover:bg-white/10"
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/60 bg-bg-primary/98 backdrop-blur-xl px-4 py-4 space-y-2 lg:hidden shadow-2xl"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold transition-colors',
                    isActive
                      ? 'bg-brand/20 text-brand'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-white'
                  )
                }
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink
                to="/watchlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-3 py-2.5 text-base font-semibold transition-colors',
                    isActive
                      ? 'bg-brand/20 text-brand'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-white'
                  )
                }
              >
                Daftar Saya
              </NavLink>
            )}
            {hasUploadAccess && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-3 py-2.5 text-base font-bold transition-colors text-amber-400 hover:bg-amber-500/10',
                    isActive ? 'bg-amber-500/20 text-amber-300' : ''
                  )
                }
              >
                🎬 Studio Kreator / Upload
              </NavLink>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
