const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function clearAuthToken() { localStorage.removeItem('halo-token'); }
export function setAuthToken(token: string) { localStorage.setItem('halo-token', token); }
export async function request<T>(path: string, options?: RequestInit): Promise<T> { const token = localStorage.getItem('halo-token'); const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) }; const r = await fetch(`${API}${path}`, { ...options, headers }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
