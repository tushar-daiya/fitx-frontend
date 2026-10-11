import { getAppInstanceId, identifyUser, track } from "@/src/lib/analytics";
import {
  apiFetch,
  clearPreAuthToken,
  clearToken,
  setPreAuthToken,
  setToken,
} from "@/src/lib/api";
import type { AuthResponse, FitXUser, PreAuthResponse } from "@/src/types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { AppEventsLogger } from "react-native-fbsdk-next";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

// Result of login()/signup() when phone verification still needs to happen —
// no full session exists yet, only a short-lived pre-auth token.
type PhoneVerificationPending = {
  phoneVerificationRequired: true;
  phone: string | null;
};

type AuthState = {
  user: FitXUser | null;
  loading: boolean;
  login: (
    identifier: string,
    password: string,
  ) => Promise<PhoneVerificationPending | void>;
  signup: (
    email: string,
    phone: string,
    password: string,
    name: string,
    opts?: { referralCode?: string; marketingOptIn?: boolean },
  ) => Promise<{ phone: string; referralApplied: boolean }>;
  verifySignupOtp: (phone: string, otp: string) => Promise<void>;
  resendOtp: (phone: string) => Promise<void>;
  collectPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  requestPasswordReset: (phone: string) => Promise<void>;
  resetPassword: (
    phone: string,
    otp: string,
    newPassword: string,
  ) => Promise<void>;
  changePhoneRequest: (phone: string) => Promise<void>;
  changePhoneVerify: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

async function completeSession(r: AuthResponse, method: string, isSignup: boolean) {
  await setToken(r.token);
  await clearPreAuthToken();
  syncUserProps(r.user);
  syncAnalyticsId();
  if (isSignup) {
    track("sign_up", { method });
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
      [AppEventsLogger.AppEventParams.RegistrationMethod]: method,
    });
  } else {
    track("login", { method });
  }
  const { registerDevicePushToken } = await import("@/src/pushNotifications");
  registerDevicePushToken().catch(() => {});
}

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
            const { registerDevicePushToken } =
              await import("@/src/pushNotifications");
            registerDevicePushToken().catch(() => {});
          }
        } catch {
          set({ user: null, loading: false });
          await clearToken();
        }
      },

      login: async (identifier, password) => {
        const r = await apiFetch<AuthResponse | PreAuthResponse>("/auth/login", {
          method: "POST",
          body: { identifier, password },
          auth: false,
        });
        if ("phone_verification_required" in r && r.phone_verification_required) {
          await setPreAuthToken(r.pre_auth_token);
          return { phoneVerificationRequired: true, phone: r.phone };
        }
        const auth = r as AuthResponse;
        set({ user: auth.user });
        await completeSession(auth, "password", false);
      },

      signup: async (email, phone, password, name, opts) => {
        const r = await apiFetch<PreAuthResponse>("/auth/signup", {
          method: "POST",
          body: {
            email,
            phone,
            password,
            name,
            referral_code: opts?.referralCode || undefined,
            marketing_opt_in: opts?.marketingOptIn ?? true,
          },
          auth: false,
        });
        await setPreAuthToken(r.pre_auth_token);
        return { phone: r.phone ?? phone, referralApplied: !!r.referral_applied };
      },

      verifySignupOtp: async (phone, otp) => {
        const r = await apiFetch<AuthResponse>("/auth/signup/verify", {
          method: "POST",
          body: { phone, otp },
          auth: false,
        });
        set({ user: r.user });
        await completeSession(r, "phone", true);
      },

      resendOtp: async (phone) => {
        await apiFetch("/auth/otp/resend", {
          method: "POST",
          body: { phone },
          auth: false,
        });
      },

      collectPhone: async (phone) => {
        await apiFetch("/auth/phone/collect", {
          method: "POST",
          body: { phone },
          auth: "preauth",
        });
      },

      verifyPhoneOtp: async (phone, otp) => {
        const r = await apiFetch<AuthResponse>("/auth/phone/verify", {
          method: "POST",
          body: { phone, otp },
          auth: "preauth",
        });
        set({ user: r.user });
        await completeSession(r, "phone", false);
      },

      requestPasswordReset: async (phone) => {
        await apiFetch("/auth/forgot-password/request-otp", {
          method: "POST",
          body: { phone },
          auth: false,
        });
      },

      resetPassword: async (phone, otp, newPassword) => {
        await apiFetch("/auth/forgot-password/reset", {
          method: "POST",
          body: { phone, otp, new_password: newPassword },
          auth: false,
        });
      },

      changePhoneRequest: async (phone) => {
        await apiFetch("/users/phone/change-request", {
          method: "POST",
          body: { phone },
        });
      },

      changePhoneVerify: async (phone, otp) => {
        const u = await apiFetch<FitXUser>("/users/phone/change-verify", {
          method: "POST",
          body: { phone, otp },
        });
        set({ user: u });
        syncUserProps(u);
      },

      logout: async () => {
        track("logout");
        await clearToken();
        await clearPreAuthToken();
        set({ user: null });
        syncUserProps(null);
      },
    }),
    {
      name: "fitx-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
