import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';
import { env } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL, hasUploadAccessFromRoles } from '@/utils/tier';
import {
  IconCrown,
  IconLogout,
  IconTag,
  IconUsers,
  IconMessageSquare,
  IconSettings,
  IconBookmark,
  IconIdCard,
  IconUser,
} from '@/components/icons';
import { movieStore } from '@/services/movieStore.service';

const NAV_LINKS = [
  { label: 'Beranda', to: ROUTES.HOME },
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
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
    setSearchQuery('');
    navigate(`/watch/${movieId}`);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolled
          ? 'bg-[#0b0914]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl py-2 sm:py-2.5'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-3 sm:py-4'
      )}
    >
      <div className="mx-auto flex max-w-[1920px] items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Mobile Live Search Modal/Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-0 z-50 flex items-center gap-2 bg-[#0d0a17] border-b border-white/10 p-3 shadow-2xl"
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari video..."
                  className="w-full h-9 pl-9 pr-8 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500"
                />
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-zinc-400 text-xs"
                  >
                    ✕
                  </button>
                )}
              </form>
              <button
                type="button"
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
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <img
              src="/images/logo_v2.png"
              alt={env.APP_NAME}
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_10px_rgba(255,51,120,0.3)]"
            />
            <span className="bg-pink-600/20 text-pink-400 border border-pink-500/40 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider">
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
                      isActive ? 'text-white font-bold text-pink-500' : 'text-zinc-400 hover:text-white'
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

        {/* Right Action Icons & User Menu Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Live Search Input (Desktop & Tablet) */}
          <div ref={searchContainerRef} className="relative hidden md:block">
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
                className="h-8.5 pl-8 pr-7 rounded-lg bg-[#14111f] hover:bg-[#1a1727] focus:bg-[#1a1727] border border-white/10 focus:border-pink-500/50 text-xs text-white placeholder-zinc-400 focus:outline-none transition-all duration-200 w-32 lg:w-48 lg:focus:w-64"
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
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#12101b]/98 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 border-b border-white/5 flex justify-between">
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
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <img
                          src={movie.backdropUrl || movie.posterUrl || '/images/logo_v2.png'}
                          alt={movie.title}
                          className="h-10 w-14 rounded object-cover bg-zinc-900 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-pink-400 transition-colors">
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
                    className="w-full text-center py-2 mt-1 rounded-lg bg-pink-500/20 hover:bg-pink-500 text-pink-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
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
            className="md:hidden flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[#14101e] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Buka Pencarian"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Sleek Icon Button Bar Matching Reference Style */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#14101e] border border-white/10 p-1 rounded-xl shadow-inner">
            {/* 1. Tag / Promo Icon */}
            <Link
              to="/exclusive-info"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-pink-400 hover:bg-white/[0.06] transition-colors"
              title="Paket Akses & Promo"
              aria-label="Paket Akses & Promo"
            >
              <IconTag className="w-4 h-4" />
            </Link>

            {/* 2. Community / Private Server Icon */}
            <Link
              to="/private-server"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-white/[0.06] transition-colors"
              title="Feed Komunitas & Private Server"
              aria-label="Feed Komunitas"
            >
              <IconUsers className="w-4 h-4" />
            </Link>

            {/* 3. Discord Chat Icon */}
            <a
              href={DISCORD_BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-[#5865F2] hover:bg-white/[0.06] transition-colors"
              title="Chat Server Discord"
              aria-label="Chat Server Discord"
            >
              <IconMessageSquare className="w-4 h-4" />
            </a>

            {/* 4. Settings Icon */}
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <IconSettings className="w-4 h-4" />
            </Link>

            {/* 5. User Profile Button with Gradient Circle */}
            <div ref={dropdownRef} className="relative flex items-center">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff3b7b] via-[#e60067] to-[#7928ca] text-white font-black text-xs shadow-md border border-white/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden"
                aria-expanded={isUserMenuOpen}
                aria-label="Menu pengguna"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'ON'}</span>
                )}
              </button>

              {/* User Dropdown Menu Matching Reference Image */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2.5 w-60 rounded-2xl bg-[#13111c]/98 backdrop-blur-2xl border border-white/10 p-2.5 shadow-2xl z-50 space-y-1"
                  >
                    {/* Header Profile with Gradient Avatar */}
                    <div className="flex items-center gap-3 p-2 mb-1 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#ff3b7b] to-[#9b42f5] flex items-center justify-center font-black text-white text-sm shrink-0 shadow-md">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'ON'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.name || 'onlyxavira'}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-medium truncate">
                          {tierConfig.label === 'REGULAR' ? 'Member' : `${tierConfig.label} Member`}
                        </p>
                      </div>
                    </div>

                    {/* Menu Items with Icons */}
                    <div className="space-y-0.5 pt-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <IconUser className="w-4 h-4 text-zinc-400" />
                        <span>Profil Saya</span>
                      </Link>

                      <Link
                        to="/profile?tab=public"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <IconIdCard className="w-4 h-4 text-zinc-400" />
                        <span>Profil Publik</span>
                      </Link>

                      <Link
                        to="/private-server"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <IconUsers className="w-4 h-4 text-zinc-400" />
                        <span>Feed Komunitas</span>
                      </Link>

                      <a
                        href={DISCORD_BOT_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <IconMessageSquare className="w-4 h-4 text-zinc-400" />
                        <span>Chat Teman</span>
                      </a>

                      <Link
                        to="/watchlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <IconBookmark className="w-4 h-4 text-zinc-400" />
                        <span>Video Tersimpan</span>
                      </Link>

                      {hasUploadAccess && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <IconCrown className="w-4 h-4 text-amber-400" />
                          <span>Studio Admin / Upload</span>
                        </Link>
                      )}
                    </div>

                    {/* Footer Exit Link */}
                    <div className="border-t border-white/5 pt-1 mt-1">
                      {isAuthenticated ? (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            lock();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#ff3b5c] hover:bg-[#ff3b5c]/10 transition-colors text-left cursor-pointer"
                        >
                          <IconLogout className="w-4 h-4 text-[#ff3b5c]" />
                          <span>Keluar</span>
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-pink-400 hover:bg-pink-500/10 transition-colors text-left"
                        >
                          <IconUser className="w-4 h-4 text-pink-400" />
                          <span>Masuk Akun</span>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Navigation Toggle */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-zinc-300 rounded-lg hover:bg-white/10"
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
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/10 bg-[#0c0916]/98 backdrop-blur-2xl px-4 py-4 space-y-3"
          >
            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      isActive ? 'bg-white/10 text-pink-400 font-bold' : 'text-zinc-300 hover:bg-white/5'
                    )
                  }
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
