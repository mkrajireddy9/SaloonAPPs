import * as NativeSecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SecureStore = {
  getItemAsync: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null)
      : NativeSecureStore.getItemAsync(key),
  setItemAsync: (key: string, value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.setItem(key, value))
      : NativeSecureStore.setItemAsync(key, value),
  deleteItemAsync: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.removeItem(key))
      : NativeSecureStore.deleteItemAsync(key),
};

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export async function getAccessToken() {
  return SecureStore.getItemAsync("halo-access-token");
}
export async function setSession(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync("halo-access-token", accessToken);
  if (refreshToken)
    await SecureStore.setItemAsync("halo-refresh-token", refreshToken);
}
export async function refreshSession() {
  const refreshToken = await SecureStore.getItemAsync("halo-refresh-token");
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;
  const result = (await response.json()) as {
    accessToken: string;
    refreshToken?: string;
  };
  await setSession(result.accessToken, result.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await SecureStore.getItemAsync("halo-access-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 401 && retry && (await refreshSession()))
    return api<T>(path, options, false);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message || "Request failed",
    );
  return body as T;
}

export async function signOut() {
  await SecureStore.deleteItemAsync("halo-access-token");
  await SecureStore.deleteItemAsync("halo-refresh-token");
}
