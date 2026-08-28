/**
 * Daftar Kategori & Genre Platform Dewasa 18+ (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 */

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const GENRES: Genre[] = [
  { id: '1', name: 'Romance & Sensual', slug: 'romance-sensual', description: 'Kisah romantis dan adegan sensual berkelas' },
  { id: '2', name: 'Drama Dewasa', slug: 'drama-dewasa', description: 'Alur cerita dramatis bertema hubungan dewasa' },
  { id: '3', name: 'Cosplay & Roleplay', slug: 'cosplay-roleplay', description: 'Penampilan kostum tematik dan roleplay karakter' },
  { id: '4', name: 'POV & Immersive', slug: 'pov-immersive', description: 'Video sudut pandang orang pertama realistis' },
  { id: '5', name: 'Asian & JAV Style', slug: 'asian-jav-style', description: 'Koleksi tema sinema Asia eksklusif' },
  { id: '6', name: 'Western & Premiere', slug: 'western-premiere', description: 'Koleksi rilisan studio barat beresolusi tinggi' },
  { id: '7', name: 'Talent Showcase', slug: 'talent-showcase', description: 'Video khusus talent dan kreator resmi Sekolah Nakal' },
  { id: '8', name: 'Uncensored Cut', slug: 'uncensored-cut', description: 'Edisi spesial tanpa sensor kualitas master' },
  { id: '9', name: 'Thriller & Passion', slug: 'thriller-passion', description: 'Kombinasi ketegangan misteri dan romantisme' },
  { id: '10', name: 'Behind The Scenes', slug: 'behind-the-scenes', description: 'Dokumenter rekaman di balik layar pembuatan video' },
  { id: '11', name: 'Late Night Affair', slug: 'late-night-affair', description: 'Serial bertema pertemuan rahasia larut malam' },
  { id: '12', name: 'Indie & Amateur', slug: 'indie-amateur', description: 'Karya independen talent kreator baru' },
];

export function getGenreBySlug(slug: string): Genre | undefined {
  return GENRES.find((g) => g.slug === slug);
}
