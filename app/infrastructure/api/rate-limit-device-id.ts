const STORAGE_KEY = 'sambasku_x_device_id';
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function newDeviceId(): string {
  const bytes = new Uint8Array(26);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < 26; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

/**
 * Opaque id stabil per browser untuk header X-Device-Id
 * (rate limit + mute kontribusi anon). Panjang 26, alphabet Crockford.
 */
export function getRateLimitDeviceId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return newDeviceId();
  }
  try {
    const existing = localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
    if (existing.length >= 8 && existing.length <= 64) return existing;
    const id = newDeviceId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return newDeviceId();
  }
}
