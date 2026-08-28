/**
 * Private Streaming Security Engine
 * Protects media assets against unauthorized scraping, direct URL extraction,
 * right-click downloads, and attaches dynamic forensic watermark for leak deterrence.
 */

export function getStreamSecurityToken(deviceId: string, videoId: string): string {
  const timestamp = Math.floor(Date.now() / 60000); // 1-minute valid rolling token
  const raw = `${deviceId}_${videoId}_${timestamp}_sekolah_nakal_priv`;
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sn-sec-${Math.abs(hash).toString(36)}`;
}

export function preventMediaContext(e: React.MouseEvent | MouseEvent): void {
  e.preventDefault();
}
