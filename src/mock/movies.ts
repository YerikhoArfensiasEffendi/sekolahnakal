/**
 * Database Konten Streaming 18+ (Sekolah Nakal)
 * Dibikin khusus untuk: Murid Sekolah Nakal & Vidio Enjoyers
 * Author: beone - sekolah nakal web dev
 */

import type { Movie, MovieDetail, StreamingData, VideoTier } from '@/types/movie';

const createMovie = (id: string, title: string, genres: string[], overrides?: Partial<Movie>): Movie => ({
  id,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  posterUrl: `https://picsum.photos/seed/sn-${id}-poster/300/450`,
  backdropUrl: `https://picsum.photos/seed/sn-${id}-bg/1280/720`,
  year: 2024,
  duration: 120,
  rating: 8.5,
  genres,
  tier: 'regular',
  overview: `${title} adalah sajian video eksklusif persembahan Sekolah Nakal khusus untuk Murid Sekolah Nakal dan Vidio Enjoyers sejati.`,
  ...overrides,
});

// Katalog Starter 18+ Sekolah Nakal (Reguler, VVIP, VIP, Talent)
const movies: Movie[] = [
  createMovie('1', 'Private Affair: Midnight Romance', ['Romance & Sensual', 'Drama Dewasa'], {
    year: 2024,
    duration: 128,
    rating: 8.8,
    tier: 'vvip',
    overview: 'Konten EXCLUSIF VVIP: Rekaman eksklusif investigasi asmara mendalam tanpa sensor khusus member VVIP & Vidio Enjoyers.',
  }),
  createMovie('2', 'Cosplay Fantasy: Secret Academy', ['Cosplay & Roleplay', 'Asian & JAV Style'], {
    year: 2024,
    duration: 135,
    rating: 8.5,
    tier: 'vip',
    overview: 'Konten EXCLUSIF VIP: Serial roleplay tematik kostum khusus dengan visual sinematik memukau bagi Murid Sekolah Nakal.',
  }),
  createMovie('3', 'POV Experience: Sweet Seduction', ['POV & Immersive', 'Romance & Sensual'], {
    year: 2024,
    duration: 112,
    rating: 8.4,
    tier: 'talent',
    overview: 'Konten EXCLUSIF TALENT: Sudut pandang orang pertama (POV) realistis bersama talent resmi Sekolah Nakal.',
  }),
  createMovie('4', 'Reguler Free: Summer Romance', ['Romance & Sensual', 'Drama Dewasa'], {
    year: 2024,
    duration: 105,
    rating: 7.9,
    tier: 'regular',
    overview: 'Konten REGULER GRATIS: Kisah romansa dewasa musim panas yang dapat disaksikan bebas oleh semua Murid Sekolah Nakal.',
  }),
  createMovie('5', 'VVIP Vault: Uncensored Master Cut', ['Uncensored Cut', 'Eksklusif VVIP'], {
    year: 2024,
    duration: 148,
    rating: 9.6,
    tier: 'vvip',
    overview: 'Konten EXCLUSIF VVIP: Master release kualitas ultra-high bitrate 4K tanpa sensor eksklusif member VVIP.',
  }),
  createMovie('6', 'Late Night Rendezvous', ['Late Night Affair', 'Thriller & Passion'], {
    year: 2024,
    duration: 118,
    rating: 8.3,
    tier: 'vip',
    overview: 'Konten EXCLUSIF VIP: Pertemuan rahasia larut malam penuh gairah dan ketegangan romantis.',
  }),
  createMovie('7', 'Talent Secret Session #01', ['Talent Showcase', 'POV & Immersive'], {
    year: 2024,
    duration: 95,
    rating: 9.1,
    tier: 'talent',
    overview: 'Konten EXCLUSIF TALENT: Sesi privat kolaborasi khusus bersama talent verified Sekolah Nakal.',
  }),
  createMovie('8', 'Reguler Free: Tokyo Twilight', ['Asian & JAV Style', 'Romance & Sensual'], {
    year: 2024,
    duration: 132,
    rating: 8.1,
    tier: 'regular',
    overview: 'Konten REGULER GRATIS: Sinema romantis bernuansa malam kota Tokyo untuk seluruh Vidio Enjoyers.',
  }),
  createMovie('9', 'VVIP Vault: Archive Room 09', ['Uncensored Cut', 'Eksklusif VVIP'], {
    year: 2024,
    duration: 98,
    rating: 9.5,
    tier: 'vvip',
    overview: 'Konten EXCLUSIF VVIP: Arsip rekaman privat ruang rahasia kualitas master tak tersensor.',
  }),
  createMovie('10', 'Talent Behind The Scenes', ['Behind The Scenes', 'Talent Showcase'], {
    year: 2024,
    duration: 115,
    rating: 8.9,
    tier: 'talent',
    overview: 'Konten EXCLUSIF TALENT: Rekaman eksklusif proses di balik layar produksi video para talent.',
  }),
  createMovie('11', 'Western Premiere: Velvet Night', ['Western & Premiere', 'Drama Dewasa'], {
    year: 2024,
    duration: 140,
    rating: 8.6,
    tier: 'vip',
    overview: 'Konten EXCLUSIF VIP: Serial sinema dewasa gaya barat beresolusi tinggi dan alur cerita berkelas.',
  }),
  createMovie('12', 'Reguler Free: Sunset Passion', ['Romance & Sensual', 'Drama Dewasa'], {
    year: 2024,
    duration: 110,
    rating: 8.0,
    tier: 'regular',
    overview: 'Konten REGULER GRATIS: Kisah asmara hangat saat matahari terbenam untuk tontonan gratis Vidio Enjoyers.',
  }),
];

export const mockMovies = {
  all: movies,
  featured: movies[0]!,
  featuredSlides: movies.slice(0, 5),
  trending: movies.slice(0, 8),
  popular: movies.filter((m) => m.rating >= 8.2),
  newReleases: [...movies].sort((a, b) => b.year - a.year).slice(0, 8),
  regular: movies.filter((m) => !m.tier || m.tier === 'regular'),
  vvip: movies.filter((m) => m.tier === 'vvip'),
  vip: movies.filter((m) => m.tier === 'vip'),
  talent: movies.filter((m) => m.tier === 'talent'),
};

export function getMockMovieDetail(id: string): MovieDetail {
  const movie = movies.find((m) => m.id === id) || {
    id,
    title: 'Video Streaming Sekolah Nakal',
    slug: `video-${id}`,
    posterUrl: '/images/logo_v2.png',
    backdropUrl: '/images/logo_v2.png',
    year: 2026,
    duration: 120,
    rating: 0,
    genres: ['Umum'],
    tier: 'regular',
    overview: 'Sajian video eksklusif persembahan Sekolah Nakal.',
  };
  const rawTier = ((movie.tier as string) || 'regular').toLowerCase().trim();
  const safeTier: VideoTier = rawTier === 'vip' || rawTier === 'vvip' || rawTier === 'talent' ? (rawTier as VideoTier) : 'regular';

  return {
    ...movie,
    tier: safeTier,
    director: 'Official Sekolah Nakal Studio',
    cast: ['Talent Verified', 'Special Guest', 'Vidio Enjoyer Guest'],
    maturityRating: '18+',
    language: 'Indonesia / Dual Audio',
    releaseDate: `${movie.year || 2026}-06-15`,
    similarMovies: movies.filter((m) => m.id !== id && m.genres?.some((g) => movie.genres?.includes(g))).slice(0, 6),
  };
}

export function getMockStreamingData(id: string): StreamingData {
  const detail = getMockMovieDetail(id);
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ];
  const videoIndex = (Number(id) || 0) % sampleVideos.length;

  return {
    sources: [
      {
        type: 'mp4',
        url: sampleVideos[videoIndex]!,
        quality: '1080p',
      },
    ],
    subtitles: [
      {
        label: 'Indonesia',
        language: 'id',
        url: '/subtitles/sample-id.vtt',
        default: true,
      },
    ],
    poster: detail.backdropUrl,
    title: detail.title,
    duration: detail.duration * 60,
  };
}
