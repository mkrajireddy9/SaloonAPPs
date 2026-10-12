import * as NativeSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SecureStore = {
  getItemAsync: (key: string) => Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null) : NativeSecureStore.getItemAsync(key),
  deleteItemAsync: (key: string) => Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(key)) : NativeSecureStore.deleteItemAsync(key),
};

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('halo-access-token');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(' ') : body.message || 'Request failed');
  return body as T;
}

export async function signOut() { await SecureStore.deleteItemAsync('halo-access-token'); await SecureStore.deleteItemAsync('halo-refresh-token'); }
