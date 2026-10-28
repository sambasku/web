const KEY = 'sambasku_access_token';

export function readAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(KEY);
}

export function writeAccessToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}

export function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
