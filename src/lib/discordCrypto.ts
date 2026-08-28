import type { DiscordAccount } from '@/utils/tier';

const DISCORD_SESSION_SECRET = 'sn_discord_oauth_secret_hash_2024';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SignedDiscordAccount extends DiscordAccount {
  deviceSignature?: string;
}

/**
 * Sign a Discord account session with specific device ID salt
 */
export async function signDiscordSession(
  account: DiscordAccount,
  deviceId: string
): Promise<SignedDiscordAccount> {
  const payload = `${account.id}:${account.username}:${account.roles.join(',')}:${deviceId}:${account.syncedAt}:${DISCORD_SESSION_SECRET}`;
  const signature = await sha256(payload);

  return {
    ...account,
    deviceSignature: signature.slice(0, 32),
  };
}

/**
 * Verify that a Discord account session belongs to this specific device
 */
export async function verifyDiscordSession(
  account: DiscordAccount | null | undefined,
  deviceId: string
): Promise<boolean> {
  if (!account) return false;
  const signed = account as SignedDiscordAccount;
  if (!signed.deviceSignature) return true; // Legacy fallback

  const payload = `${signed.id}:${signed.username}:${signed.roles.join(',')}:${deviceId}:${signed.syncedAt}:${DISCORD_SESSION_SECRET}`;
  const expectedSig = await sha256(payload);

  return expectedSig.slice(0, 32) === signed.deviceSignature;
}
