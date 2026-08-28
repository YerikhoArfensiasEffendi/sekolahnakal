import type { VideoTier } from '@/types/movie';

const DRM_SECRET_KEY = 'sn_drm_vault_master_key_2024';

/**
 * Generate SHA-256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SignedStreamCredentials {
  token: string;
  expiresAt: number;
  deviceId: string;
  signature: string;
  signedUrl: string;
}

/**
 * Generate cryptographic signed expiring stream URL bound to specific device ID and Tier
 */
export async function generateSignedStreamUrl(
  rawUrl: string,
  movieId: string,
  deviceId: string,
  tier: VideoTier
): Promise<SignedStreamCredentials> {
  // Token expires in 60 minutes
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const payload = `${movieId}:${deviceId}:${tier}:${expiresAt}:${DRM_SECRET_KEY}`;
  const signature = await sha256(payload);

  const urlObj = new URL(rawUrl, window.location.origin);
  urlObj.searchParams.set('drm_token', signature.slice(0, 32));
  urlObj.searchParams.set('exp', String(expiresAt));
  urlObj.searchParams.set('did', deviceId.slice(0, 12));
  urlObj.searchParams.set('tier', tier);

  return {
    token: signature.slice(0, 32),
    expiresAt,
    deviceId,
    signature,
    signedUrl: urlObj.toString(),
  };
}

/**
 * Validate stream signature against device ID and expiry
 */
export async function verifySignedStream(
  signedUrl: string,
  movieId: string,
  deviceId: string,
  tier: VideoTier
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const url = new URL(signedUrl, window.location.origin);
    const token = url.searchParams.get('drm_token');
    const expStr = url.searchParams.get('exp');

    if (!token || !expStr) {
      return { valid: false, reason: 'DRM Token tidak ditemukan pada stream' };
    }

    const expiresAt = parseInt(expStr, 10);
    if (Date.now() > expiresAt) {
      return { valid: false, reason: 'Sesi streaming telah kedaluwarsa (Expired Token)' };
    }

    const payload = `${movieId}:${deviceId}:${tier}:${expiresAt}:${DRM_SECRET_KEY}`;
    const expectedSig = await sha256(payload);

    if (expectedSig.slice(0, 32) !== token) {
      return { valid: false, reason: 'Tanda tangan kriptografi tidak cocok (Device Mismatch)' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Gagal memverifikasi tanda tangan stream' };
  }
}
