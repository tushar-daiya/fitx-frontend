import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, setToken, clearToken } from "@/src/lib/api";
import type { FitXUser, AuthResponse } from "@/src/types/api";

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
          if (wasNull && u) {
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
      },

      logout: async () => {
        await clearToken();
        set({ user: null });
      },
    }),
    {
      name: "fitx-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
    }
  )
);
