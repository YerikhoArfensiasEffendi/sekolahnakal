/**
 * API endpoint constants.
 * Relative to API_BASE_URL.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  MOVIES: {
    LIST: '/movies',
    DETAIL: (id: string) => `/movies/${id}`,
    TRENDING: '/movies/trending',
    POPULAR: '/movies/popular',
    NEW_RELEASES: '/movies/new-releases',
    SEARCH: '/movies/search',
    BY_GENRE: (genre: string) => `/movies/genre/${genre}`,
    STREAM: (id: string) => `/movies/${id}/stream`,
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
    WATCHLIST: '/user/watchlist',
    WATCHLIST_TOGGLE: (movieId: string) => `/user/watchlist/${movieId}`,
    HISTORY: '/user/history',
    WATCH_PROGRESS: (movieId: string) => `/user/progress/${movieId}`,
  },
} as const;
