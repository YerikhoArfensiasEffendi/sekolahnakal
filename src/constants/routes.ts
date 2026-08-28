/**
 * Centralized route path constants.
 * Use these instead of hardcoding path strings.
 */
export const ROUTES = {
  HOME: '/',
  GALLERY: '/gallery',
  EXCLUSIVE_INFO: '/exclusive-info',
  PRIVATE_SERVER: '/private-server',
  BROWSE: '/gallery',
  MOVIE_DETAIL: '/movie/:id',
  SEARCH: '/search',
  GENRE: '/genre/:slug',
  WATCH: '/watch/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PROFILE: '/profile',
  WATCHLIST: '/watchlist',
  HISTORY: '/history',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  NOT_FOUND: '*',
} as const;

/** Generate movie detail path */
export function movieDetailPath(id: string): string {
  return `/movie/${id}`;
}

/** Generate watch path */
export function watchPath(id: string): string {
  return `/watch/${id}`;
}

/** Generate genre path */
export function genrePath(slug: string): string {
  return `/genre/${slug}`;
}
