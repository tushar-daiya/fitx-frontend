import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
export const API = `${BASE}/api`;
const TOKEN_KEY = "fitx_token";

export const getToken = () => storage.getItem<string>(TOKEN_KEY, "");
export const setToken = (t: string) => storage.setItem(TOKEN_KEY, t);
export const clearToken = () => storage.removeItem(TOKEN_KEY);

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
    await clearToken();
    // lazy import to avoid circular dep at module init time
    const { useAuthStore } = await import("@/src/store/auth");
    useAuthStore.getState().logout();
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const d = data as any;
    const msg = d?.detail ?? d?.message ?? `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}
