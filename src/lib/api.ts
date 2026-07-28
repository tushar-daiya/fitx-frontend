import { storage } from "@/src/utils/storage";
import { track } from "@/src/lib/analytics";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
export const API = `${BASE}/api`;
const TOKEN_KEY = "fitx_token";

// Collapse dynamic segments (ids, hashes) so the endpoint param stays bounded.
function normalizeEndpoint(path: string): string {
  return path
    .split("?")[0]
    .split("/")
    .map((seg) =>
      /^\d+$/.test(seg) || /^[0-9a-f]{8,}$/i.test(seg) || seg.length > 20
        ? ":id"
        : seg
    )
    .join("/");
}

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
  const method = opts.method ?? "GET";
  const endpoint = normalizeEndpoint(path);
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (networkErr) {
    // Network failure (offline, timeout, etc.)
    // track("api_error", { endpoint, method, status: 0 });
    throw networkErr;
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
    track("api_error", { endpoint, method, status: 401 });
    await clearToken();
    // lazy import to avoid circular dep at module init time
    const { useAuthStore } = await import("@/src/store/auth");
    useAuthStore.getState().logout();
    // throw new Error("Session expired");
  }
  if (!res.ok) {
    track("api_error", { endpoint, method, status: res.status });
    const d = data as any;
    const msg = d?.detail ?? d?.message ?? `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  // Log successful mutations as user actions (GETs are covered by screen views).
  if (method !== "GET") {
    track("api_action", { endpoint, method, status: res.status });
  }
  return data as T;
}
