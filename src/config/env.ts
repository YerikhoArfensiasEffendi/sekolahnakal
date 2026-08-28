/**
 * Centralized, typed environment configuration.
 * All VITE_ env vars accessed through this module.
 */
export const env = {
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Sekolah Nakal',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  ENABLE_ADMIN: import.meta.env.VITE_ENABLE_ADMIN === 'true',
  ENABLE_REGISTRATION: import.meta.env.VITE_ENABLE_REGISTRATION === 'true',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
