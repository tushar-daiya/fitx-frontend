import {
  getAnalytics,
  getAppInstanceId as fbGetAppInstanceId,
  logEvent,
  logScreenView,
  setUserId,
  setUserProperties,
} from "@react-native-firebase/analytics";

/**
 * Central Firebase Analytics wrapper.
 *
 * Everything is best-effort: analytics must never crash the app or block the
 * UI, so every call is fire-and-forget and swallows errors. Firebase silently
 * drops events with invalid params, so we keep params to primitives.
 */

// Firebase event names / param keys must be <=40 chars, alphanumeric + "_",
// and start with a letter. This sanitises arbitrary strings (e.g. route paths).
function sanitizeName(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!s) s = "unknown";
  if (!/^[a-z]/.test(s)) s = "e_" + s;
  return s.slice(0, 40);
}

// Firebase only accepts string / number / boolean param values.
function sanitizeParams(
  params?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    const key = sanitizeName(k);
    if (typeof v === "string") out[key] = v.slice(0, 100);
    else if (typeof v === "number" || typeof v === "boolean") out[key] = v;
    else out[key] = String(v).slice(0, 100);
  }
  return out;
}

/** Log any user action as a custom event. */
export function track(event: string, params?: Record<string, unknown>): void {
  try {
    logEvent(getAnalytics(), sanitizeName(event), sanitizeParams(params)).catch(
      () => {}
    );
  } catch {
    // getAnalytics() can throw if native module isn't linked yet (e.g. web/dev)
  }
}

/** Log a screen view. Called automatically on route changes. */
export function trackScreen(screen: string): void {
  const name = sanitizeName(screen);
  try {
    logEvent(getAnalytics(), "screen_view", {
      screen_name: name,
      screen_class: name,
    }).catch(() => {});
  } catch {}
}

/**
 * The Firebase app instance id for this device. The backend needs it to emit
 * server-side events (e.g. trial_ended) attributed to the same analytics user.
 */
export async function getAppInstanceId(): Promise<string | null> {
  try {
    return await fbGetAppInstanceId(getAnalytics());
  } catch {
    return null;
  }
}

/** Associate all subsequent events with a user id (or clear on logout). */
export function identifyUser(
  userId: string | null,
  props?: Record<string, string | null>
): void {
  try {
    const a = getAnalytics();
    setUserId(a, userId).catch(() => {});
    if (props) setUserProperties(a, props).catch(() => {});
  } catch {}
}
