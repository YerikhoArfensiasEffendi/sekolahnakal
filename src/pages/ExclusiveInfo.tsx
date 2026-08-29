/**
 * Halaman Informasi Eksklusif & Paket Langganan Member (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Sesuai Desain Resmi:
 * - Headline Akses Permanen Sekali Bayar Tanpa Biaya Bulanan
 * - 3 Paket Member: EXCLUSIVE VIP (30k), EXCLUSIVE VVIP (65k - Terlaris), EXCLUSIVE TALENT (75k)
 * - Informasi lengkap seputar Sekolah Nakal, keamanan, garansi server, dan kontak Admin.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SideAdSlot } from '@/components/ads/SideAdSlot';
import { IconDiscord, IconTelegram } from '@/components/icons';
import { DISCORD_BOT_INVITE_URL, TELEGRAM_INVITE_URL } from '@/utils/tier';
import { TransactionHistoryFeed } from '@/components/payment/TransactionHistoryFeed';

interface PlanProps {
  id: string;
  name: string;
  price: string;
  priceRaw: number;
  badge?: string;
  isPopular?: boolean;
  theme: 'light-blue' | 'royal-blue' | 'white-card';
  features: string[];
  ctaLabel: string;
}

const PLANS: PlanProps[] = [
  {
    id: 'vip',
    name: 'EXCLUSIVE VIP',
    price: 'Rp30.000',
    priceRaw: 30000,
    theme: 'light-blue',
    features: [
      '10 Channel eksklusif di Server Utama',
      'Akses ke Private Server',
      '30 Channel eksklusif di Private Server',
      'Update konten setiap hari',
    ],
    ctaLabel: 'Pilih EXCLUSIVE VIP',
  },
  {
    id: 'vvip',
    name: 'EXCLUSIVE VVIP',
    price: 'Rp65.000',
    priceRaw: 65000,
    badge: 'TERLARIS',
    isPopular: true,
    theme: 'royal-blue',
    features: [
      '10 Channel eksklusif di Server Utama',
      'Akses ke Private Server (full akses)',
      '90 Channel eksklusif di Private Server',
      'Update konten setiap hari',
    ],
    ctaLabel: 'Pilih EXCLUSIVE VVIP',
  },
  {
    id: 'talent',
    name: 'EXCLUSIVE TALENT',
    price: 'Rp75.000',
    priceRaw: 75000,
    theme: 'white-card',
    features: [
      'Akses penuh ke kategori Talent Eksklusif secara permanen.',
      'Ribuan konten yang tersusun rapi di setiap folder.',
      'Update konten setiap hari',
    ],
    ctaLabel: 'Pilih EXCLUSIVE TALENT',
  },
];

const FAQS = [
  {
    q: 'Apakah pembayaran benar-benar hanya sekali seumur hidup?',
    a: 'Ya, sistem kami memberlakukan pembayaran satu kali (One-time payment). Anda mendapatkan akses permanen tanpa ada tagihan bulanan atau biaya perpanjangan.',
  },
  {
    q: 'Bagaimana cara mendapatkan akses setelah melakukan pembayaran?',
    a: 'Setelah pembayaran diverifikasi, admin atau bot kami akan langsung memberikan role akun dan link private server instan melalui Discord atau Telegram.',
  },
  {
    q: 'Metode pembayaran apa saja yang didukung?',
    a: 'Kami menerima QRIS (BCA, Mandiri, BRI, BNI, Jago, dll) serta seluruh E-Wallet Indonesia (GoPay, OVO, DANA, ShopeePay).',
  },
  {
    q: 'Apakah data dan privasi saya terjamin aman?',
    a: '100% aman dan anonim. Kami tidak membagikan data identitas member kepada pihak manapun.',
  },
];

export default function ExclusiveInfo() {
  const [selectedPlan, setSelectedPlan] = useState<PlanProps | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleOpenCheckout = (plan: PlanProps) => {
    setSelectedPlan(plan);
  };

  const generateOrderMessage = (planName: string, price: string) => {
    return encodeURIComponent(
      `Halo Admin Sekolah Nakal, saya ingin upgrade akun ke paket *${planName}* (${price}). Mohon instruksi nomor rekening / QRIS pembayaran.`
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-16 pb-24 text-text-primary select-none">
      {/* Top Hero Banner Header */}
      <section className="relative w-full bg-[#1e50c4] text-white py-12 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-2xl">
        {/* Background Subtle Shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10">
          {/* Top Brand Tag */}
          <div className="flex justify-end mb-4">
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase bg-white/20 px-3.5 py-1 rounded-full backdrop-blur-md border border-white/30">
              SEKOLAH NAKAL
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="max-w-4xl space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[42px] font-black leading-tight tracking-tight text-white drop-shadow-md">
              Dengan satu kali pembayaran, kamu akan mendapatkan akses permanen tanpa biaya bulanan dan tanpa perpanjangan.
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 font-medium pt-2">
              Nikmati kebebasan streaming video eksklusif 18+ berkecepatan tinggi tanpa sensor langsung di browser atau server private.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area with Ad Wings */}
      <div className="relative mx-auto max-w-[1720px] px-2 sm:px-4 lg:px-8 flex justify-center items-start gap-4 lg:gap-8 -mt-8 z-20">
        {/* Left Side Ad Wing */}
        <SideAdSlot position="left" />

        {/* Center Pricing & Info Container */}
        <div className="flex-1 max-w-6xl min-w-0 space-y-16">
          {/* 3 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {PLANS.map((plan) => {
              const isVvip = plan.theme === 'royal-blue';
              const isVip = plan.theme === 'light-blue';

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className={`relative flex flex-col justify-between rounded-2xl overflow-hidden shadow-2xl border transition-all ${
                    isVvip
                      ? 'bg-[#1c53d6] text-white border-blue-400/50 scale-[1.03] z-10 shadow-blue-900/50'
                      : isVip
                      ? 'bg-[#bfdbfe] text-[#0f2d6b] border-blue-300'
                      : 'bg-[#f0f6ff] text-[#0f2d6b] border-blue-200'
                  }`}
                >
                  {/* TERLARIS Badge Header on VVIP */}
                  {plan.badge && (
                    <div className="w-full bg-[#93c5fd] py-1.5 text-center text-xs font-black tracking-wider text-[#1e3a8a] uppercase border-b border-blue-300">
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-6 flex-1">
                    {/* Header: Tier Name */}
                    <div>
                      <span
                        className={`text-xs sm:text-sm font-black tracking-wider uppercase block ${
                          isVvip ? 'text-blue-200' : 'text-blue-900/80'
                        }`}
                      >
                        {plan.name}
                      </span>

                      {/* Giant Price in Pixel / Bold Style */}
                      <div className="mt-2 text-3xl sm:text-4xl font-black tracking-tight font-mono">
                        {plan.price}
                      </div>
                    </div>

                    {/* Feature List */}
                    <div className="pt-2 space-y-3">
                      {plan.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                              isVvip
                                ? 'bg-white text-blue-700'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            ✓
                          </span>
                          <span className={isVvip ? 'text-blue-50 font-medium' : 'text-slate-800 font-medium'}>
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handleOpenCheckout(plan)}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
                        isVvip
                          ? 'bg-white hover:bg-blue-50 text-blue-700 shadow-blue-950/30'
                          : isVip
                          ? 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-blue-800/30'
                          : 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-blue-800/30'
                      }`}
                    >
                      {plan.ctaLabel}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Keunggulan & Fasilitas Member */}
          <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-10 space-y-8 shadow-xl">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                Mengapa Bergabung di Sekolah Nakal?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Layanan streaming independen terbaik dengan perlindungan privasi tertinggi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-2xl">⚡</div>
                <h3 className="text-sm font-bold text-white">Dedicated Private CDN</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Server berkecepatan tinggi tanpa buffering, mendukung kualitas 1080p Full HD hingga 4K.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-2xl">🔒</div>
                <h3 className="text-sm font-bold text-white">Privasi Anonim 100%</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bebas dari pelacakan dan tidak memerlukan data pribadi sensitif untuk menonton.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-2xl">🎬</div>
                <h3 className="text-sm font-bold text-white">Update Konten Harian</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Rilisan eksklusif baru ditambahkan setiap hari ke dalam folder terorganisir.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-2xl">💬</div>
                <h3 className="text-sm font-bold text-white">Bantuan Admin 24/7</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tim customer service siap membantu aktivasi dan kendala teknis setiap saat.
                </p>
              </div>
            </div>
          </div>

          {/* Live Bukti Pembelian & Aktivasi Member */}
          <TransactionHistoryFeed limit={12} />

          {/* FAQ Accordion Section */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Pertanyaan yang Sering Diajukan (FAQ)</h2>
              <p className="text-xs text-zinc-400">Informasi seputar pendaftaran, aktivasi, dan keamanan layanan.</p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-zinc-800/50"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                      <span className="text-zinc-400 text-sm font-bold">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-zinc-300 border-t border-zinc-800/50 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Help / Hubungi Admin Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-blue-900/60 via-zinc-900 to-zinc-950 border border-blue-500/30 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg sm:text-2xl font-black text-white">Butuh Bantuan atau Ingin Tanya Dulu?</h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                Hubungi Admin resmi Sekolah Nakal melalui Discord atau Telegram untuk bantuan pendaftaran dan konfirmasi aktivasi instan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={TELEGRAM_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
              >
                <IconTelegram className="w-4 h-4" />
                <span>Chat Telegram Admin</span>
              </a>

              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25"
              >
                <IconDiscord className="w-4 h-4" />
                <span>Buka Server Discord</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Side Ad Wing */}
        <SideAdSlot position="right" />
      </div>

      {/* Checkout / Order Popup Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 p-6 sm:p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Aktivasi Langganan</span>
              <h3 className="text-xl font-black text-white">{selectedPlan.name}</h3>
              <p className="text-2xl font-black font-mono text-white pt-1">{selectedPlan.price}</p>
              <p className="text-[11px] text-zinc-400">Akses Permanen Sekali Bayar · Tanpa Iuran Bulanan</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
              <p className="font-bold text-white">Cara Pemesanan:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                <li>Klik salah satu tombol admin di bawah untuk mengirim pesan otomatis.</li>
                <li>Admin akan mengirimkan QRIS / Nomor Rekening resmi.</li>
                <li>Setelah transfer, kirimkan bukti pembayaran dan akun Anda akan langsung diaktifkan!</li>
              </ol>
            </div>

            <div className="space-y-2.5">
              <a
                href={`https://t.me/sekolahanakal?text=${generateOrderMessage(selectedPlan.name, selectedPlan.price)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                <IconTelegram className="w-4 h-4" />
                <span>Pesan via Telegram</span>
              </a>

              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                <IconDiscord className="w-4 h-4" />
                <span>Pesan via Discord Bot</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
