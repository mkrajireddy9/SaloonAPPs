const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export async function request<T>(path: string, options?: RequestInit): Promise<T> { const r = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json' }, ...options }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
