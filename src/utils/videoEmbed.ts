/**
 * Helper Utility Pemrosesan URL Video & Embed Player (Sekolah Nakal)
 * Mendukung Direct MP4, HLS (.m3u8), Lulustream, Doodstream, Streamtape, dll.
 */

export function getDirectStreamUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // ZeroStorage: ubah /embed/xxx, /watch/xxx, /file/xxx menjadi direct MP4 stream endpoint
  const zsMatch = trimmed.match(/zerostorage\.net\/(?:embed|watch|file|api\/files)\/([a-zA-Z0-9_-]+)/i);
  if (zsMatch && zsMatch[1]) {
    return `https://zerostorage.net/api/files/${zsMatch[1]}/stream`;
  }

  return trimmed;
}

export function isEmbedUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();

  // ZeroStorage memiliki direct stream endpoint yang bisa langsung diputar di ArtPlayer tanpa iklan!
  if (trimmed.includes('zerostorage.net')) {
    return false;
  }

  // Jika berupa direct stream HLS / MP4, selalu putar di ArtPlayer asli!
  if (
    trimmed.includes('.m3u8') ||
    trimmed.includes('.mp4') ||
    trimmed.includes('.webm') ||
    trimmed.includes('.mkv') ||
    trimmed.includes('/uploads/videos/') ||
    trimmed.includes('/api/files/')
  ) {
    return false;
  }

  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) return true;

  if (
    trimmed.includes('dood') ||
    trimmed.includes('streamtape') ||
    trimmed.includes('filemoon') ||
    trimmed.includes('streamwish') ||
    trimmed.includes('mixdrop') ||
    trimmed.includes('voe.sx') ||
    trimmed.includes('luluvdo.com/e/') ||
    trimmed.includes('lulustream.com/e/') ||
    trimmed.includes('vidcloud') ||
    trimmed.includes('youtube.com/embed') ||
    trimmed.includes('player.vimeo.com') ||
    trimmed.includes('/e/') ||
    trimmed.includes('/embed/')
  ) {
    return true;
  }
  return false;
}

export function extractEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Jika input berupa tag iframe penuh: <iframe src="..." ...></iframe>
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }

  // ZeroStorage: ubah /file/xxx, /watch/xxx, atau /api/files/xxx/stream jadi /embed/xxx
  const zsMatch = trimmed.match(/zerostorage\.net\/(?:embed|watch|file|api\/files)\/([a-zA-Z0-9_-]+)/i);
  if (zsMatch && zsMatch[1]) {
    return `https://zerostorage.net/embed/${zsMatch[1]}`;
  }

  // Lulustream: ubah https://luluvdo.com/xxx atau https://lulustream.com/xxx jadi /e/xxx
  if (trimmed.includes('luluvdo.com/') && !trimmed.includes('/e/')) {
    return trimmed.replace('luluvdo.com/', 'luluvdo.com/e/');
  }
  if (trimmed.includes('lulustream.com/') && !trimmed.includes('/e/')) {
    return trimmed.replace('lulustream.com/', 'lulustream.com/e/');
  }

  // DoodStream: ubah /d/ jadi /e/
  if (trimmed.includes('dood') && trimmed.includes('/d/')) {
    return trimmed.replace('/d/', '/e/');
  }

  // Streamtape: ubah /v/ jadi /e/
  if (trimmed.includes('streamtape.com/v/')) {
    return trimmed.replace('/v/', '/e/');
  }

  // Filemoon: ubah /d/ atau /v/ jadi /e/
  if (trimmed.includes('filemoon.') && (trimmed.includes('/d/') || trimmed.includes('/v/'))) {
    return trimmed.replace(/\/d\/|\/v\//, '/e/');
  }

  // Streamwish: ubah /f/ jadi /e/
  if (trimmed.includes('streamwish.') && trimmed.includes('/f/')) {
    return trimmed.replace('/f/', '/e/');
  }

  // YouTube: ubah watch?v= jadi /embed/
  if (trimmed.includes('youtube.com/watch?v=')) {
    const videoId = trimmed.split('v=')[1]?.split('&')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  } else if (trimmed.includes('youtu.be/')) {
    const videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }

  return trimmed;
}
