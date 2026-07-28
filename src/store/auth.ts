import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, setToken, clearToken } from "@/src/lib/api";
import { track, identifyUser, getAppInstanceId } from "@/src/lib/analytics";
import type { FitXUser, AuthResponse } from "@/src/types/api";

// Send this device's Firebase app instance id to the backend so it can emit
// server-side lifecycle events (e.g. trial_ended). Best-effort, never throws.
async function syncAnalyticsId() {
  // Only iOS/Android map to a Firebase data stream; skip web/other.
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  try {
    const id = await getAppInstanceId();
    if (id)
      await apiFetch("/users/analytics-id", {
        method: "POST",
        body: { app_instance_id: id, platform: Platform.OS },
      });
  } catch {}
}

function syncUserProps(u: FitXUser | null) {
  identifyUser(u ? String(u.id) : null, {
    goal: u?.profile?.goal ?? null,
    level: u?.profile?.level ?? null,
    diet: u?.profile?.diet ?? null,
    subscription: u?.subscription ?? null,
    role: u?.role ?? null,
    onboarded: u ? String(u.onboarded) : null,
  });
}

type AuthState = {
  user: FitXUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,

      refresh: async () => {
        try {
          const u = await apiFetch<FitXUser>("/auth/me");
          const wasNull = get().user === null;
          set({ user: u, loading: false });
          syncUserProps(u);
          if (wasNull && u) {
            syncAnalyticsId();
            const { registerDevicePushToken } = await import(
              "@/src/pushNotifications"
            );
            registerDevicePushToken().catch(() => {});
          }
        } catch {
          set({ user: null, loading: false });
          await clearToken();
        }
      },

      login: async (email, password) => {
        const r = await apiFetch<AuthResponse>("/auth/login", {
          method: "POST",
          body: { email, password },
          auth: false,
        });
        await setToken(r.token);
        set({ user: r.user });
        track("login", { method: "email" });
        syncUserProps(r.user);
        syncAnalyticsId();
        const { registerDevicePushToken } = await import(
          "@/src/pushNotifications"
        );
        registerDevicePushToken().catch(() => {});
      },

      signup: async (email, password, name) => {
        const r = await apiFetch<AuthResponse>("/auth/signup", {
          method: "POST",
          body: { email, password, name },
          auth: false,
        });
        await setToken(r.token);
        set({ user: r.user });
        track("sign_up", { method: "email" });
        syncUserProps(r.user);
        syncAnalyticsId();
      },

      logout: async () => {
        track("logout");
        await clearToken();
        set({ user: null });
        syncUserProps(null);
      },
    }),
    {
      name: "fitx-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
    }
  )
);
