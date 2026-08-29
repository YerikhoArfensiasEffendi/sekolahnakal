/**
 * Utility to generate and persist a unique device/client ID and default profile.
 */

const DEVICE_ID_KEY = 'sekolah_nakal_device_id';
const PROFILE_NAME_KEY = 'sekolah_nakal_profile_name';
const PROFILE_AVATAR_KEY = 'sekolah_nakal_profile_avatar';

export const DEFAULT_AVATAR = '/images/logo_v2.png';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // Generate a clean 6-character device identifier
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    id = `DEV-${rand}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getSavedProfileName(): string {
  const saved = localStorage.getItem(PROFILE_NAME_KEY);
  if (saved && saved.trim()) return saved.trim();
  const deviceId = getOrCreateDeviceId();
  return `Murid #${deviceId.replace('DEV-', '')}`;
}

export function saveProfileName(name: string): void {
  localStorage.setItem(PROFILE_NAME_KEY, name.trim());
}

export function getSavedAvatar(): string {
  const saved = localStorage.getItem(PROFILE_AVATAR_KEY);
  // Pastikan tidak mengambil gambar acak eksternal (seperti picsum.photos)
  if (saved && !saved.includes('picsum.photos')) {
    return saved;
  }
  // Default selalu menggunakan logo resmi Sekolah Nakal yang ada di /images/logo.png
  localStorage.setItem(PROFILE_AVATAR_KEY, DEFAULT_AVATAR);
  return DEFAULT_AVATAR;
}

export function saveAvatar(url: string): void {
  localStorage.setItem(PROFILE_AVATAR_KEY, url);
}

export function clearDeviceSession(): void {
  localStorage.removeItem(PROFILE_NAME_KEY);
  localStorage.removeItem(PROFILE_AVATAR_KEY);
  const rand = Math.floor(100000 + Math.random() * 900000).toString();
  const id = `DEV-${rand}`;
  localStorage.setItem(DEVICE_ID_KEY, id);
}
