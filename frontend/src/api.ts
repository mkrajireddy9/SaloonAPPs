const API = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3000';
export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!(error instanceof Error)) return fallback;
  try {
    const payload = JSON.parse(error.message) as { message?: string | string[] };
    const messages = Array.isArray(payload.message) ? payload.message : [payload.message];
    const message = messages.filter(Boolean).join(' ');
    if (/guestPhone|phone/i.test(message)) return 'Enter a valid mobile number, for example +91 98450 12345.';
    if (/already requested|already booked|conflict/i.test(message)) return 'That time is no longer available. Please choose another slot.';
    if (/unauthorized|invalid email|invalid password/i.test(message)) return 'The email or password is incorrect.';
    if (message) return message;
  } catch {
    if (error.message && !error.message.startsWith('{')) return error.message;
  }
  return fallback;
}
export function clearAuthToken() { localStorage.removeItem('halo-token'); }
export function setAuthToken(token: string) { localStorage.setItem('halo-token', token); }
export function setAuthSession(accessToken: string, refreshToken: string) { setAuthToken(accessToken); localStorage.setItem('halo-refresh-token', refreshToken); }
export function clearAuthSession() { localStorage.removeItem('halo-token'); localStorage.removeItem('halo-refresh-token'); }
async function rotateAccessToken() { const refreshToken = localStorage.getItem('halo-refresh-token'); if (!refreshToken) return false; const response = await fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken }) }); if (!response.ok) return false; const result = await response.json() as { accessToken: string; refreshToken: string }; setAuthSession(result.accessToken, result.refreshToken); return true; }
export async function request<T>(path: string, options?: RequestInit): Promise<T> { const send = () => { const token = localStorage.getItem('halo-token'); const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) }; return fetch(`${API}${path}`, { cache: 'no-store', ...options, headers }); }; let r = await send(); if (r.status === 401 && path !== '/auth/refresh' && await rotateAccessToken()) r = await send(); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function uploadFile(file: File): Promise<{ id: string; url: string; mimeType: string; size: number }> { const token = localStorage.getItem('halo-token'); const body = new FormData(); body.append('file', file); let response = await fetch(`${API}/media/upload`, { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body }); if (response.status === 401 && await rotateAccessToken()) { const refreshed = localStorage.getItem('halo-token'); response = await fetch(`${API}/media/upload`, { method: 'POST', headers: refreshed ? { authorization: `Bearer ${refreshed}` } : {}, body }); } if (!response.ok) throw new Error(await response.text()); return response.json(); }
export async function deleteMedia(source: string) { const match = source.match(/\/media\/([^/?]+)/); if (!match) return; await request(`/media/${match[1]}`, { method: 'DELETE' }); }
export function authenticatedImageUrl(source: string) { if (!source || !source.includes('/media/')) return source; const normalized = source.startsWith('/media/') ? `${API}${source}` : source; const token = localStorage.getItem('halo-token'); return token ? `${normalized}${normalized.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : normalized; }
