/**
 * Full-width Official Hero Banner (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Menampilkan Banner Grafis Resmi Sekolah Nakal secara full-width edge-to-edge
 * - Bersih, rapi, responsif, dan menyatu alami dengan halaman Beranda
 */

import type { Movie } from '@/types/movie';
import { DISCORD_BOT_INVITE_URL } from '@/utils/tier';

interface MovieHeroProps {
  movies?: Movie[];
  movie?: Movie;
}

export function MovieHero(_props?: MovieHeroProps) {
  return (
    <section className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] pt-16 overflow-hidden select-none bg-black border-b border-border/30 flex items-center justify-center">
      {/* Full-width Edge-to-Edge Banner Image */}
      <a
        href={DISCORD_BOT_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full relative group cursor-pointer flex items-center justify-center"
        aria-label="Join Discord Sekolah Nakal"
      >
        <img
          src="/images/banner_promo.png"
          alt="Sekolah Nakal"
          className="h-full w-full object-contain sm:object-contain object-center transition-transform duration-500 group-hover:scale-[1.01]"
          fetchPriority="high"
        />

        {/* Soft Vignette Transisi Bawah ke Konten */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
      </a>
    </section>
  );
}
