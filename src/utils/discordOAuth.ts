/**
 * Discord OAuth Dispatcher & Popup Manager (Sekolah Nakal)
 * Membuka jendela popup otorisasi browser resmi agar tidak dibajak oleh aplikasi Discord Desktop
 */

export const DISCORD_CLIENT_ID = '1494541202379509780';
export const DISCORD_GUILD_ID = '1542462858066010124';

export function getDiscordOAuthUrl(): string {
  const redirectUri = encodeURIComponent(window.location.origin + '/');
  return `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=token&scope=identify&redirect_uri=${redirectUri}&prompt=consent`;
}

export function launchDiscordOAuth(): void {
  const url = getDiscordOAuthUrl();
  const width = 520;
  const height = 820;
  const left = Math.max(0, (window.screen.width - width) / 2);
  const top = Math.max(0, (window.screen.height - height) / 2);

  try {
    const popup = window.open(
      url,
      'DiscordAuthWindow',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = url;
    } else {
      popup.focus();
    }
  } catch {
    window.location.href = url;
  }
}
