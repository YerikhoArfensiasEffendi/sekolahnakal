import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL } from '@/utils/tier';
import { getDiscordOAuthUrl, launchDiscordOAuth } from '@/utils/discordOAuth';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
  IconDiscord,
  IconLogout,
  IconRefresh,
  IconCheck,
} from '@/components/icons';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const discordSectionRef = useRef<HTMLDivElement | null>(null);

  const { user, deviceId, tier, discordAccount, updateProfile, disconnectDiscord, logout } = useAuth();
  const { lock } = useSiteGate();
  const { success, info } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [preferredQuality, setPreferredQuality] = useState('1080p');
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tierConfig = getTierBadgeConfig(tier);

  // Auto scroll to Discord Sync Section if navigated with ?tab=discord
  useEffect(() => {
    if (searchParams.get('tab') === 'discord' && discordSectionRef.current) {
      discordSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  const handleDiscordOAuth = () => {
    launchDiscordOAuth();
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name: name.trim() });
      setIsSaving(false);
      success('Nama akun berhasil disimpan.');
    }, 200);
  };

  const handleDisconnect = () => {
    disconnectDiscord();
    info('Koneksi Discord telah diputuskan.');
  };

  const renderTierIcon = () => {
    switch (tierConfig.iconType) {
      case 'crown':
        return <IconCrown className="w-3.5 h-3.5 text-amber-400" />;
      case 'star':
        return <IconStar className="w-3.5 h-3.5 text-purple-400" />;
      case 'diamond':
        return <IconDiamond className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <IconUser className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
      {/* Top Banner Header */}
      <div className="pb-8 border-b border-border/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Pengaturan Aplikasi
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1.5">
            Kelola preferensi resolusi, integrasi role Discord, dan identitas perangkat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-hover text-xs font-semibold text-text-secondary hover:text-white border border-border transition-colors"
          >
            Lihat Profil →
          </Link>
        </div>
      </div>

      {/* Spacious 2-Column Wide Layout */}
      <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (Settings Navigation & Device Info) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="space-y-3 pb-6 border-b border-border/25">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Identitas Perangkat
            </h3>
            <div className="p-3.5 rounded-xl bg-bg-surface/40 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">ID Perangkat</span>
                <span className="font-mono text-xs font-bold text-white">{deviceId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Status Akun</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <IconCheck className="w-3.5 h-3.5" />
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-xs text-text-muted">Tier Aktif</span>
                <div className={`inline-flex items-center gap-1 ${tierConfig.badgeClass}`}>
                  {renderTierIcon()}
                  <span>{tierConfig.shortLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section Anchors */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Daftar Menu
            </h3>
            <nav className="flex flex-col space-y-1 text-xs font-medium">
              <a
                href="#discord-sync"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Sinkronisasi Role Discord</span>
                <IconDiscord className="w-4 h-4 text-[#5865F2]" />
              </a>
              <a
                href="#profile-name"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Nama Pengguna</span>
                <IconUser className="w-4 h-4" />
              </a>
              <a
                href="#playback"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Preferensi Pemutaran Video</span>
                <span>⚙</span>
              </a>
            </nav>
          </div>
        </aside>

        {/* Right Column (Settings Form Controls) */}
        <main className="lg:col-span-8 space-y-8 divide-y divide-border/25">
          {/* Section 1: Discord Synchronization Hub */}
          <section ref={discordSectionRef} id="discord-sync" className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <IconDiscord className="w-5 h-5 text-[#5865F2]" />
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Sinkronisasi Role Discord (Role-Based Tier)
                  </h2>
                  <span className="text-[10px] font-semibold bg-[#5865F2]/15 text-[#9ba5ff] border border-[#5865F2]/30 rounded px-2 py-0.5">
                    Otomatis
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xl">
                  Hak akses tier (VVIP, VIP, TALENT) diberikan otomatis sesuai role di server Discord resmi Sekolah Nakal tanpa perlu token manual.
                </p>
              </div>

              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#9ba5ff] hover:underline"
              >
                Kunjungi Server Discord →
              </a>
            </div>

            {/* Connected View OR Sync Form */}
            {discordAccount ? (
              <div className="rounded-xl bg-bg-surface/50 border border-border/50 p-4 sm:p-5 space-y-3.5 max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={discordAccount.avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border border-[#5865F2]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">@{discordAccount.username}</p>
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                          <IconCheck className="w-3 h-3" />
                          Terhubung
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-text-muted">
                        <span>Role:</span>
                        {(discordAccount?.roles || []).map((r) => (
                          <span
                            key={r}
                            className="bg-[#5865F2]/20 text-[#9ba5ff] border border-[#5865F2]/40 rounded px-1.5 py-0.2 text-[10px] font-medium"
                          >
                            @{r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 ${tierConfig.badgeClass}`}>
                    {renderTierIcon()}
                    <span>{tierConfig.label}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/20 text-xs">
                  <span className="text-text-muted text-[11px]">
                    Terakhir diperbarui: {new Date(discordAccount.syncedAt).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDiscordOAuth}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-hover text-white text-xs font-semibold hover:bg-bg-surface border border-border/60 transition-colors cursor-pointer"
                    >
                      <IconRefresh className="w-3.5 h-3.5" />
                      <span>Sinkron Ulang</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                    >
                      Putuskan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-bg-surface/50 border border-border/50 p-5 space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white">Hubungkan Akun Discord Anda</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Klik tombol di bawah untuk login melalui Discord. Role server Anda (@ADMIN, @KREATOR, @VVIP, @VIP, @TALENT) akan otomatis dibaca oleh Bot untuk menentukan tier akun Anda secara realtime.
                  </p>
                </div>

                <div>
                  <a
                    href={getDiscordOAuthUrl()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/25 transition-all cursor-pointer"
                  >
                    <IconDiscord className="w-4 h-4" />
                    <span>⚡ Hubungkan Akun Discord (OAuth2)</span>
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Edit Username */}
          <section id="profile-name" className="pt-8 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Nama Pengguna</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Nama ini akan ditampilkan pada pemutar video dan kolom komentar.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 max-w-lg">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ketik username baru..."
              />
              <Button
                type="submit"
                isLoading={isSaving}
                className="px-6 py-2 rounded-lg text-xs font-bold"
              >
                Simpan Perubahan
              </Button>
            </form>
          </section>

          {/* Section 3: Playback Preferences */}
          <section id="playback" className="pt-8 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Preferensi Pemutaran</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Sesuaikan resolusi default dan pemutaran otomatis.
              </p>
            </div>

            <div className="space-y-3.5 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Kualitas Streaming Default
                </label>
                <select
                  value={preferredQuality}
                  onChange={(e) => setPreferredQuality(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-xs font-medium text-white focus:border-brand focus:outline-none"
                >
                  <option value="Auto">Otomatis (Adaptif)</option>
                  <option value="1080p">Tinggi (1080p Full HD)</option>
                  <option value="720p">Sedang (720p HD)</option>
                  <option value="480p">Hemat Data (480p SD)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={autoplayNext}
                  onChange={(e) => setAutoplayNext(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <label htmlFor="autoplay" className="text-xs font-medium text-text-secondary cursor-pointer">
                  Putar video berikutnya secara otomatis
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Logout */}
          <section className="pt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Sesi Perangkat
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Menghapus identifikasi sesi perangkat ini dan kembali ke panel kunci awal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                lock();
                success('Sesi berhasil dikeluarkan.');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <IconLogout className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
