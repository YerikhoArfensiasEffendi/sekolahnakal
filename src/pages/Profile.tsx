import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteGate } from '@/contexts/SiteGateContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTierBadgeConfig, DISCORD_BOT_INVITE_URL } from '@/utils/tier';
import {
  IconCrown,
  IconStar,
  IconDiamond,
  IconUser,
  IconDiscord,
  IconLogout,
  IconCheck,
} from '@/components/icons';

const AVATAR_PRESETS = [
  '/images/logo.png',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=NakalCyber1&backgroundColor=1e1b4b,312e81,0f172a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=RoboNakalVVIP&backgroundColor=4c1d95,581c87,0f172a',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=ViperQueen99&backgroundColor=134e4a,064e3b,0f172a',
  'https://api.dicebear.com/7.x/micah/svg?seed=CyberPunkGhost&backgroundColor=701a75,4a044e,0f172a',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=ApeMasterNFT&backgroundColor=1e293b,0f172a',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowTalent&backgroundColor=311042,1e1b4b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=MatrixOverlord&backgroundColor=064e3b,1e293b',
];

export default function Profile() {
  const { user, deviceId, tier, discordAccount, updateProfile, upgradeTier, logout } = useAuth();
  const { lock } = useSiteGate();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || AVATAR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [discordToken, setDiscordToken] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tierConfig = getTierBadgeConfig(tier);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name: name.trim(), avatarUrl: selectedAvatar });
      setIsSaving(false);
      success('Nama profil dan avatar NFT berhasil diperbarui.');
    }, 200);
  };

  const handleUpgradeTier = (e: FormEvent) => {
    e.preventDefault();
    if (!discordToken.trim()) {
      error('Silakan masukkan token bot Discord.');
      return;
    }

    setIsUpgrading(true);
    setTimeout(() => {
      const res = upgradeTier(discordToken.trim());
      setIsUpgrading(false);
      if (res.success) {
        success(res.message);
        setDiscordToken('');
      } else {
        error(res.message);
      }
    }, 300);
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
            Profil Akun & Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1.5">
            Kelola data akun, avatar NFT eksklusif, dan status tier yang terhubung dengan perangkat Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-hover text-xs font-semibold text-text-secondary hover:text-white border border-border transition-colors"
          >
            Buka Pengaturan →
          </Link>
        </div>
      </div>

      {/* Spacious 2-Column Wide Layout (Seamless, Full-width) */}
      <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (Identity & Status Summary) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="space-y-4 pb-6 border-b border-border/25">
            <div className="flex items-center gap-4">
              <img
                src={selectedAvatar}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover border-2 border-brand/50 shadow-xl bg-bg-surface p-1"
              />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white leading-tight">{user?.name}</h2>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                    <IconCheck className="w-3 h-3" />
                    Perangkat Terverifikasi
                  </span>
                </div>
                <p className="font-mono text-xs text-text-muted">{deviceId}</p>
              </div>
            </div>

            {/* Tier Badge Box */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Tier Streaming Aktif
              </label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${tierConfig.badgeClass}`}>
                {renderTierIcon()}
                <span className="font-bold">{tierConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Pintasan Cepat
            </h3>
            <div className="flex flex-col space-y-1 text-xs font-medium">
              <Link
                to="/watchlist"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Daftar Tontonan Saya</span>
                <span>→</span>
              </Link>
              <Link
                to="/history"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Riwayat Nonton Terakhir</span>
                <span>→</span>
              </Link>
              <Link
                to="/settings?tab=discord"
                className="p-2.5 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Sinkronisasi Role Discord</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Column (Editable Profile Settings & Integrations) */}
        <main className="lg:col-span-8 space-y-8 divide-y divide-border/25">
          {/* Section 1: Edit Profile Name & NFT Avatar Selection */}
          <section className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Nama Tampilan & Avatar NFT</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Pilih karakter avatar NFT unik yang mewakili profil streaming Anda.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Nama Akun
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ketik nama tampilan Anda..."
                />
              </div>

              {/* Avatar Selector with Generous Headroom and No Clipping */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-semibold text-text-secondary">
                  Pilih Karakter Avatar NFT
                </label>
                <div className="py-4 px-2 -my-2 flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none">
                  {AVATAR_PRESETS.map((av, idx) => {
                    const isSelected = selectedAvatar === av;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`relative shrink-0 rounded-2xl p-1 transition-all duration-200 cursor-pointer focus:outline-none ${
                          isSelected
                            ? 'ring-2 ring-brand ring-offset-2 ring-offset-black scale-110 shadow-xl shadow-brand/25 z-10'
                            : 'ring-1 ring-border/50 opacity-60 hover:opacity-100 hover:scale-105 hover:ring-border'
                        }`}
                        aria-label={`Pilih avatar NFT ${idx + 1}`}
                      >
                        <img
                          src={av}
                          alt=""
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover bg-bg-surface border border-white/10"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSaving}
                className="px-6 py-2.5 text-xs font-bold rounded-lg"
              >
                Simpan Profil & Avatar
              </Button>
            </form>
          </section>

          {/* Section 2: Discord Account & Role Status */}
          <section className="pt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <IconDiscord className="w-5 h-5 text-[#5865F2]" />
                  Sinkronisasi Server Discord
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Role Discord Anda secara otomatis menentukan akses konten eksklusif (VVIP, VIP, TALENT).
                </p>
              </div>

              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#9ba5ff] hover:underline"
              >
                Server Discord Resmi →
              </a>
            </div>

            {discordAccount ? (
              <div className="flex items-center justify-between bg-bg-surface/50 rounded-lg border border-border/40 p-4 max-w-xl">
                <div className="flex items-center gap-3.5">
                  <img
                    src={discordAccount.avatarUrl}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover border border-[#5865F2]"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">@{discordAccount.username}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Role Aktif: <strong className="text-[#9ba5ff]">{discordAccount.roles.join(', ')}</strong>
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings?tab=discord"
                  className="text-xs font-semibold text-text-secondary hover:text-white"
                >
                  Kelola di Pengaturan
                </Link>
              </div>
            ) : (
              <form onSubmit={handleUpgradeTier} className="flex gap-2 max-w-lg pt-1">
                <input
                  type="text"
                  value={discordToken}
                  onChange={(e) => setDiscordToken(e.target.value)}
                  placeholder="Masukkan token Discord atau bot..."
                  className="flex-1 rounded-lg bg-bg-surface/50 border border-border px-3.5 py-2.5 text-xs font-mono text-white placeholder-text-muted focus:border-brand focus:outline-none"
                />
                <Button
                  type="submit"
                  isLoading={isUpgrading}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg"
                >
                  Verifikasi
                </Button>
              </form>
            )}
          </section>

          {/* Section 3: Device Session Logout */}
          <section className="pt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Sesi Perangkat Ini
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Keluar dan bersihkan data sesi pada perangkat ini.
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
