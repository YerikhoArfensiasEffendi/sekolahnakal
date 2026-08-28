export type VideoTier = 'regular' | 'vip' | 'vvip' | 'talent';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  duration: number; // in minutes
  rating: number; // 0-10
  genres: string[];
  overview: string;
  tier?: VideoTier;
  videoUrl?: string;
  previewUrl?: string;
  views?: number;
}

export interface MovieDetail extends Movie {
  director: string;
  cast: string[];
  trailerUrl?: string;
  maturityRating: string;
  language: string;
  releaseDate: string;
  similarMovies: Movie[];
}

export interface VideoSource {
  type: 'mp4' | 'hls' | 'dash';
  url: string;
  quality?: string;
}

export interface SubtitleTrack {
  label: string;
  language: string;
  url: string;
  default?: boolean;
}

export interface StreamingData {
  sources: VideoSource[];
  subtitles: SubtitleTrack[];
  poster: string;
  title: string;
  duration: number;
}

export interface WatchProgress {
  movieId: string;
  currentTime: number;
  duration: number;
  updatedAt: string;
}
