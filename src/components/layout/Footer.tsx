/**
 * Minimalist Editorial Footer Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 */

import { env } from '@/config/env';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/40 py-8 mt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-2.5">
        <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed max-w-4xl mx-auto">
          <strong className="text-red-500 font-bold">PERINGATAN 18+:</strong> Situs ini hanya diperuntukkan bagi pengguna yang telah berusia 18 tahun ke atas. Semua konten, model, dan talent telah memenuhi standar kepatuhan usia dewasa (18+ RTA Compliance).
        </p>
        <p className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} {env.APP_NAME} — Dibuat untuk Murid Sekolah Nakal &amp; Vidio Enjoyers. Web Dev: <span className="text-zinc-400">beone</span>.
        </p>
      </div>
    </footer>
  );
}
