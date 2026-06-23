# FitX Frontend Migration Plan
## Expo 54 → 56 | Context API → Zustand | manual fetch → TanStack Query

Reference old app at `../old-frontend/`. Every phase is independently testable.

---

## Phase 0 — Package Installation

Run once before anything else.

```bash
pnpm add \
  @expo/vector-icons \
  expo-secure-store \
  @react-native-async-storage/async-storage \
  expo-notifications \
  expo-image-picker \
  expo-location \
  expo-camera \
  expo-blur \
  expo-linear-gradient \
  react-native-svg \
  react-native-safe-area-context \
  react-native-razorpay \
  zustand
```

Also copy from `old-frontend/`:
- `.env` → `frontend/.env` (contains `EXPO_PUBLIC_BACKEND_URL`)
- `google-services.json` → `frontend/google-services.json`
- `GoogleService-Info.plist` → `frontend/GoogleService-Info.plist`

**Test gate:** `pnpm expo start` compiles without module-not-found errors.

---

## Phase 1 — `app.json`

Replace `frontend/app.json` with the old-frontend version, updating:

- `name`: `"FitX"`, `slug`: `"fitx"`, `scheme`: `"fitx"`
- `primaryColor`: `"#D4AF37"`
- `userInterfaceStyle`: `"dark"`
- `newArchEnabled`: `true`
- iOS: `bundleIdentifier`, `buildNumber`, `googleServicesFile`, all `infoPlist` permissions
- Android: `package`, `versionCode`, `googleServicesFile`, `adaptiveIcon`, `edgeToEdgeEnabled`, all `permissions`
- Plugins: add `expo-notifications` (with icon/color), `expo-image-picker` (with permissions), `expo-location` (with permission), keep existing `expo-router` and `expo-splash-screen`
- Inside the `expo-router` plugin entry add `"root": "src"` so Router looks in `src/app/` not `app/`
- `extra.eas.projectId`: copy from old app.json

**Test gate:** `pnpm expo start` shows correct app name "FitX".

---

## Phase 2 — Theme (single source of truth)

**Create `src/theme.ts`** — copy verbatim from `old-frontend/src/theme.ts`.

This is the only file that needs to change to retheme the entire app. Contents:

```ts
export const COLORS = {
  bg, surface, surfaceElevated, surface2,
  gold, goldPremium, goldMuted,
  textPrimary, textSecondary, textMuted,
  border, borderAccent,
  success, error, warning,
};
export const RADIUS = { sm, md, lg, xl, xxl, pill };
export const SPACING = { xs, s, m, l, xl, xxl };
export const FONT = { h1, h2, h3, body, small, caption };
```

No logic — pure constants. Every screen imports from `@/src/theme`.

**Test gate:** TypeScript resolves `@/src/theme` with no errors.

---

## Phase 3 — TypeScript Types

**Create `src/types/api.ts`** with all API response shapes derived from `API_DOCS.md`.

```ts
// ── Auth ──────────────────────────────────────────────────────────────────
export type UserProfile = {
  gender: "male" | "female" | "other";
  age: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  goal: "fat_loss" | "lean_bulk" | "body_recomp";
  level: "beginner" | "intermediate" | "advanced";
  diet: "veg" | "non_veg" | "eggetarian" | "vegan" | "jain";
};

export type FitXUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  onboarded: boolean;
  profile: UserProfile | null;
  subscription: "trial" | "3m" | "6m" | "12m" | "none";
  trial_ends: string;
  trial_used: boolean;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  user: FitXUser;
};

// ── Subscription ──────────────────────────────────────────────────────────
export type PlanId = "trial" | "3m" | "6m" | "12m";

export type SubscriptionPlan = {
  id: PlanId;
  label: string;
  price: number;
  currency: string;
  days: number;
  perks: string[];
  popular?: boolean;
};

export type ActivePlan = {
  id: string;
  plan: PlanId;
  status: "active" | "upcoming" | "expired";
  starts_at: string;
  ends_at: string;
  days_remaining: number;
  activated_by_user: boolean;
};

export type SubscriptionStatus = {
  active: boolean;
  needs_payment: boolean;
  plan: string;
  days_remaining: number;
  active_plans: ActivePlan[];
  upcoming_plans: ActivePlan[];
  history: ActivePlan[];
};

export type SubscribeResponse = {
  plan: PlanId;
  ends: string;
  price: number;
};

// ── Payments ──────────────────────────────────────────────────────────────
export type PaymentOrder = {
  order_id: string;
  amount: number;       // paise (INR) or cents (USD)
  currency: string;
  key_id: string;
  plan: PlanId;
};

export type PaymentVerifyResponse = {
  ok: boolean;
  plan: PlanId;
  status: string;
  starts_at: string;
  ends_at: string;
};

export type PaymentRecord = {
  id: string;
  user_id: string;
  order_id: string;
  plan: PlanId;
  amount: number;
  currency: string;
  gateway: string;
  status: "paid" | "pending" | "failed";
  payment_id: string;
  created_at: string;
  paid_at: string;
};

// ── AI Plans ──────────────────────────────────────────────────────────────
export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
};

export type WorkoutDay = {
  day: string;
  focus: string;
  type: "home" | "gym";
  exercises: WorkoutExercise[];
};

export type DietMeal = {
  meal: string;
  time: string;
  items: string[];
  calories: number;
  protein_g: number;
};

export type AIPlan = {
  summary: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fats_g: number;
  target_water_glasses: number;
  workout_plan: WorkoutDay[];
  diet_plan: DietMeal[];
};

export type PlanResponse = {
  id: string;
  user_id: string;
  plan: AIPlan;
  created_at: string;
};

// ── Meals ─────────────────────────────────────────────────────────────────
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealLog = {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  meal_type: MealType;
  is_cheat: boolean;
  image_base64: string | null;
};

export type MealTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

export type MealsToday = {
  meals: MealLog[];
  totals: MealTotals;
};

export type ScanResult = {
  name: string;
  confidence: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  portion: string;
  notes: string;
};

// ── Daily Tracking ────────────────────────────────────────────────────────
export type DailyTracking = {
  water_glasses: number;
  steps: number;
  date: string;
};

// ── Avatar ────────────────────────────────────────────────────────────────
export type AvatarProgress = {
  progress: number;
  leanness: number;
  muscle: number;
  days: number;
  estimated_kg_change: number;
  goal: string;
  gender: "male" | "female" | "other";
};

// ── Chat ──────────────────────────────────────────────────────────────────
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  user_id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  at: string;
};

export type ChatSendResponse = {
  reply: string;
};

// ── Recipes ───────────────────────────────────────────────────────────────
export type DietType = "veg" | "non_veg" | "eggetarian" | "vegan" | "jain";

export type Recipe = {
  id: string;
  title: string;
  diet: DietType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  ingredients: string[];
  steps: string[];
  cuisine: string;
  image_url: string;
  created_at: string;
};

// ── Workout Videos ────────────────────────────────────────────────────────
export type WorkoutVideo = {
  id: string;
  title: string;
  type: "home" | "gym";
  muscle: string;
  level: "beginner" | "intermediate" | "advanced";
  duration_min: number;
  video_url: string;
  thumbnail: string;
  created_at: string;
};

// ── Gyms ──────────────────────────────────────────────────────────────────
export type Gym = {
  name: string;
  lat: number;
  lon: number;
  distance_m: number;
  address: string;
  phone: string;
  website: string;
  opening_hours: string;
  type: string;
};

export type GymsResponse = {
  count: number;
  search_radius_m: number;
  gyms: Gym[];
};

// ── Form Analysis ─────────────────────────────────────────────────────────
export type FormExercise = {
  id: string;
  label: string;
  key_joints: string[];
  ideal: string;
};

export type JointRange = {
  min: number;
  max: number;
  range: number;
  mean: number;
};

export type FormAnalysisResult = {
  exercise: string;
  exercise_detected: string;
  confidence: "low" | "medium" | "high";
  score: number;
  summary: string;
  coaching_points: string[];
  ideal_form: string;
  frames_analyzed: number;
  duration_s: number;
  joint_ranges: Record<string, JointRange>;
};

// ── Admin ─────────────────────────────────────────────────────────────────
export type AdminStats = {
  users: number;
  trial_users: number;
  meals_logged: number;
  chat_messages: number;
  recipes: number;
  plans_generated: number;
  top_meals: { name: string; count: number }[];
};

export type NotificationResponse = {
  ok: boolean;
  notification_id: string;
  sent: number;
  failed: number;
  invalid_tokens_removed: number;
};
```

**Test gate:** TypeScript compiles with `pnpm tsc --noEmit`.

---

## Phase 4 — Storage Utilities

Copy verbatim from old-frontend:

- `src/utils/storage/storage-base.ts` — abstract base class, types, no changes
- `src/utils/storage/index.ts` — AsyncStorage + SecureStore implementation
- `src/utils/storage/index.web.ts` — localStorage fallback for web

No modifications needed. The `storage` export is used only by `src/lib/api.ts` (token) and Zustand persist adapter.

**Test gate:** TypeScript resolves `@/src/utils/storage` with no errors.

---

## Phase 5 — API Layer (`src/lib/api.ts`)

**New file** — based on `old-frontend/src/api.ts` with three improvements:

1. Remove both `console.log` statements (request + response)
2. Add 401 auto-logout — after `res.status === 401`, call `clearToken()` then `useAuthStore.getState().logout()` and throw `"Session expired"`
3. Export `API`, `getToken`, `setToken`, `clearToken` for use by the auth store

```ts
import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
export const API = `${BASE}/api`;
const TOKEN_KEY = "fitx_token";

export const getToken  = () => storage.getItem<string>(TOKEN_KEY, "");
export const setToken  = (t: string) => storage.setItem(TOKEN_KEY, t);
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
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

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
```

**Test gate:** TypeScript compiles. Import `apiFetch` in the index screen and verify no type errors.

---

## Phase 6 — Zustand Auth Store (`src/store/auth.ts`)

Replaces `old-frontend/src/auth.tsx` (Context API). No `AuthProvider` wrapper needed anywhere.

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, setToken, clearToken } from "@/src/lib/api";
import { FitXUser, AuthResponse } from "@/src/types/api";
import { registerDevicePushToken } from "@/src/pushNotifications";

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
          if (wasNull && u) registerDevicePushToken().catch(() => {});
        } catch {
          set({ user: null, loading: false });
          await clearToken();
        }
      },

      login: async (email, password) => {
        const r = await apiFetch<AuthResponse>("/auth/login", {
          method: "POST", body: { email, password }, auth: false,
        });
        await setToken(r.token);
        set({ user: r.user });
        registerDevicePushToken().catch(() => {});
      },

      signup: async (email, password, name) => {
        const r = await apiFetch<AuthResponse>("/auth/signup", {
          method: "POST", body: { email, password, name }, auth: false,
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
      // only persist user, not loading
      partialize: (s) => ({ user: s.user }),
    }
  )
);
```

Key difference from old auth: `user` is **immediately available** from AsyncStorage on cold start (no loading flash). `refresh()` validates against `/auth/me` in the background.

**Test gate:** `useAuthStore.getState().user` is accessible without a provider in any component.

---

## Phase 7 — i18n Store (`src/store/i18n.ts`)

Replaces `old-frontend/src/i18n.tsx` (Context API). Copy the full `DICT` object, convert to Zustand:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// paste DICT from old-frontend/src/i18n.tsx here
const DICT = { en: { ... }, hi: { ... } };

type Lang = "en" | "hi";
type I18nState = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: "en",
      t: (key) => DICT[get().lang][key] ?? key,
      setLang: (lang) => set({ lang }),
    }),
    { name: "fitx-lang", storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

Replace all `const { t } = useI18n()` → `const { t } = useI18nStore()` in screens.

**Test gate:** `useI18nStore.getState().t("app.tagline")` returns `"Elevate Your Fitness Journey"`.

---

## Phase 8 — Push Notifications (`src/pushNotifications.ts`)

Copy verbatim from `old-frontend/src/pushNotifications.ts`. No changes needed.

---

## Phase 9 — Avatar (`src/Avatar.tsx`)

Copy verbatim from `old-frontend/src/Avatar.tsx`. No changes needed — uses `react-native-svg`.

---

## Phase 10 — TanStack Query Hooks

**Create one file per domain** under `src/hooks/`. Each hook wraps `apiFetch` with typed responses.

### `src/hooks/useSubscription.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { SubscriptionPlan, SubscriptionStatus, SubscribeResponse } from "@/src/types/api";

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => apiFetch<SubscriptionPlan[]>("/subscription/plans"),
    staleTime: 10 * 60_000,
  });

export const useSubscriptionStatus = (enabled = true) =>
  useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => apiFetch<SubscriptionStatus>("/subscription/status"),
    staleTime: 60_000,
    enabled,
  });

export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) =>
      apiFetch<SubscribeResponse>("/subscription/subscribe", { method: "POST", body: { plan } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
};
```

### `src/hooks/usePayments.ts`
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { PaymentOrder, PaymentVerifyResponse } from "@/src/types/api";

export const useCreateOrder = () =>
  useMutation({
    mutationFn: ({ plan, currency }: { plan: string; currency?: string }) =>
      apiFetch<PaymentOrder>("/payments/create-order", {
        method: "POST", body: { plan, currency: currency ?? "INR" },
      }),
  });

export const useVerifyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => apiFetch<PaymentVerifyResponse>("/payments/verify", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
};
```

### `src/hooks/usePlans.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { PlanResponse } from "@/src/types/api";

export const useCurrentPlan = () =>
  useQuery({
    queryKey: ["plan-current"],
    queryFn: () => apiFetch<PlanResponse | null>("/plans/current"),
    staleTime: 5 * 60_000,
    retry: false,
  });

export const useGeneratePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<PlanResponse>("/plans/generate", { method: "POST" }),
    onSuccess: (data) => qc.setQueryData(["plan-current"], data),
  });
};
```

### `src/hooks/useMeals.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { MealsToday, ScanResult, MealLog, MealType } from "@/src/types/api";

export const useMealsToday = () =>
  useQuery({
    queryKey: ["meals-today"],
    queryFn: () => apiFetch<MealsToday>("/meals/today"),
    staleTime: 60_000,
  });

export const useScanMeal = () =>
  useMutation({
    mutationFn: (image_base64: string) =>
      apiFetch<ScanResult>("/meals/scan", { method: "POST", body: { image_base64 } }),
  });

export const useLogMeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string; calories: number; protein_g: number;
      carbs_g: number; fats_g: number;
      meal_type?: MealType; is_cheat?: boolean; image_base64?: string | null;
    }) => apiFetch<MealLog>("/meals/log", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals-today"] }),
  });
};

export const useDeleteMeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meal_id: string) =>
      apiFetch<{ ok: boolean }>(`/meals/${meal_id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals-today"] }),
  });
};
```

### `src/hooks/useDaily.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { DailyTracking } from "@/src/types/api";

export const useDailyToday = () =>
  useQuery({
    queryKey: ["daily-today"],
    queryFn: () => apiFetch<DailyTracking>("/daily/today"),
    staleTime: 60_000,
  });

export const useLogWater = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (glasses: number) =>
      apiFetch<{ glasses: number }>("/water/log", { method: "POST", body: { glasses } }),
    onMutate: async (glasses) => {
      await qc.cancelQueries({ queryKey: ["daily-today"] });
      const prev = qc.getQueryData<DailyTracking>(["daily-today"]);
      qc.setQueryData<DailyTracking>(["daily-today"], (old) =>
        old ? { ...old, water_glasses: glasses } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["daily-today"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["daily-today"] }),
  });
};

export const useLogSteps = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (steps: number) =>
      apiFetch<{ steps: number }>("/steps/log", { method: "POST", body: { steps } }),
    onMutate: async (steps) => {
      await qc.cancelQueries({ queryKey: ["daily-today"] });
      const prev = qc.getQueryData<DailyTracking>(["daily-today"]);
      qc.setQueryData<DailyTracking>(["daily-today"], (old) =>
        old ? { ...old, steps } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["daily-today"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["daily-today"] }),
  });
};
```

### `src/hooks/useAvatar.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { AvatarProgress } from "@/src/types/api";

export const useAvatarProgress = () =>
  useQuery({
    queryKey: ["avatar-progress"],
    queryFn: () => apiFetch<AvatarProgress>("/avatar/progress"),
    staleTime: 5 * 60_000,
  });
```

### `src/hooks/useChat.ts`
```ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { ChatMessage, ChatSendResponse } from "@/src/types/api";

export const useChatHistory = (session_id: string) =>
  useQuery({
    queryKey: ["chat-history", session_id],
    queryFn: () =>
      apiFetch<ChatMessage[]>(`/chat/history?session_id=${session_id}`),
    staleTime: Infinity,
    enabled: !!session_id,
  });

export const useSendMessage = () =>
  useMutation({
    mutationFn: ({ session_id, message }: { session_id: string; message: string }) =>
      apiFetch<ChatSendResponse>("/chat/send", { method: "POST", body: { session_id, message } }),
  });
```

### `src/hooks/useRecipes.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { Recipe, DietType } from "@/src/types/api";

export const useRecipes = (diet?: DietType | "all") =>
  useQuery({
    queryKey: ["recipes", diet ?? "all"],
    queryFn: () => {
      const qs = diet && diet !== "all" ? `?diet=${diet}` : "";
      return apiFetch<Recipe[]>(`/recipes${qs}`);
    },
    staleTime: 10 * 60_000,
  });

export const useRecipe = (id: string) =>
  useQuery({
    queryKey: ["recipe", id],
    queryFn: () => apiFetch<Recipe>(`/recipes/${id}`),
    staleTime: 10 * 60_000,
    enabled: !!id,
  });

export const useCreateRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Recipe, "id" | "created_at">) =>
      apiFetch<Recipe>("/admin/recipes", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useDeleteRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rid: string) =>
      apiFetch<{ ok: boolean }>(`/admin/recipes/${rid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};
```

### `src/hooks/useWorkouts.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { WorkoutVideo } from "@/src/types/api";

export const useWorkoutVideos = (type?: "home" | "gym", muscle?: string) =>
  useQuery({
    queryKey: ["workout-videos", type, muscle],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (muscle) params.set("muscle", muscle);
      const qs = params.toString() ? `?${params}` : "";
      return apiFetch<WorkoutVideo[]>(`/workouts/videos${qs}`);
    },
    staleTime: 10 * 60_000,
  });
```

### `src/hooks/useGyms.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { GymsResponse } from "@/src/types/api";

export const useGyms = (
  coords: { lat: number; lon: number; radius_m?: number } | null
) =>
  useQuery({
    queryKey: ["gyms", coords?.lat, coords?.lon],
    queryFn: () => {
      const { lat, lon, radius_m = 5000 } = coords!;
      return apiFetch<GymsResponse>(
        `/gyms/nearby?lat=${lat}&lon=${lon}&radius_m=${radius_m}`
      );
    },
    enabled: !!coords,
    staleTime: 5 * 60_000,
  });
```

### `src/hooks/useForm.ts`
```ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, API, getToken } from "@/src/lib/api";
import { FormExercise, FormAnalysisResult } from "@/src/types/api";

export const useFormExercises = () =>
  useQuery({
    queryKey: ["form-exercises"],
    queryFn: () => apiFetch<FormExercise[]>("/form/exercises"),
    staleTime: Infinity,
  });

// Video upload requires multipart/form-data — can't use apiFetch directly
export const useAnalyzeForm = () =>
  useMutation({
    mutationFn: async ({ videoUri, exercise = "auto" }: { videoUri: string; exercise?: string }) => {
      const token = await getToken();
      const form = new FormData();
      form.append("video", { uri: videoUri, type: "video/mp4", name: "form.mp4" } as any);
      form.append("exercise", exercise);
      const res = await fetch(`${API}/form/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`Form analysis failed (${res.status})`);
      return res.json() as Promise<FormAnalysisResult>;
    },
  });
```

### `src/hooks/useAdmin.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { AdminStats, FitXUser, NotificationResponse } from "@/src/types/api";

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
    staleTime: 60_000,
  });

export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<FitXUser[]>("/admin/users"),
    staleTime: 60_000,
  });

export const useSendNotification = () =>
  useMutation({
    mutationFn: (body: { title: string; body: string }) =>
      apiFetch<NotificationResponse>("/admin/send-notification", { method: "POST", body }),
  });
```

**Test gate:** `pnpm tsc --noEmit` passes. All hooks import correctly.

---

## Phase 11 — PaywallGuard (`src/PaywallGuard.tsx`)

Based on old-frontend but replaces manual throttle with `useSubscriptionStatus` hook:

```ts
import { useSubscriptionStatus } from "@/src/hooks/useSubscription";
import { useAuthStore } from "@/src/store/auth";

export function PaywallGuard({ children }) {
  const { user } = useAuthStore();
  const { data: status } = useSubscriptionStatus(!!user);
  // ... rest of Modal logic identical to old-frontend
  // blocked = !!user && !isAdmin && status?.needs_payment === true && !onSubscription
}
```

Removed: `lastChecked` ref, manual `check()` function, `useEffect` segment watcher, 5s throttle logic.
Added: `staleTime: 60_000` in `useSubscriptionStatus` handles de-duplication automatically.

Also copy `assets/images/icon.png` reference — used in the paywall Modal.

**Test gate:** Paywall modal renders for expired trial user. No excessive re-renders.

---

## Phase 12 — Root Layout (`src/app/_layout.tsx`)

```ts
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import QueryProvider from "@/src/provider/query";
import { PaywallGuard } from "@/src/PaywallGuard";
import { useAuthStore } from "@/src/store/auth";
import { COLORS } from "@/src/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const response = Notifications.getLastNotificationResponse();
    if (response) router.replace("/");
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.replace("/"));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" />
        <PaywallGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bg },
              animation: "fade",
            }}
          />
        </PaywallGuard>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
```

No `AuthProvider` wrapper — Zustand is global.

**Test gate:** App launches. `pnpm expo start` boots without crashes.

---

## Phase 13 — Auth Screens (testable together)

### `src/app/index.tsx` — Splash + Route Guard

Rewrite from old-frontend with one fix — 800ms minimum display to avoid flash:

```ts
// Auth state from Zustand (hydrates immediately from AsyncStorage)
const { user, loading } = useAuthStore();
// fade-in animation + pulsing dots: copy verbatim from old-frontend
// navigation: copy useEffect verbatim (checks loading → user → onboarded)
// Image source: require("../../assets/images/icon.png") — note path change from old app/
```

Path change: image requires go up one extra level (`../../assets/...`) because screens are now in `src/app/`.

### `src/app/login.tsx`
- Copy all JSX + StyleSheet verbatim from old-frontend
- Replace `const { login } = useAuth()` → `const { login } = useAuthStore()`
- Path for logo image: `../../assets/images/icon.png`

### `src/app/signup.tsx`
- Same as login — JSX verbatim, `useAuth` → `useAuthStore`, fix asset path

**Test gate:** Can navigate login → signup. Login with valid credentials routes to onboarding or tabs.

---

## Phase 14 — Onboarding (`src/app/onboarding.tsx`)

- Copy all JSX + StyleSheet + step logic verbatim
- Replace `const { refresh } = useAuth()` → `const { refresh } = useAuthStore()`
- The multi-step form submit (`apiFetch("/users/onboarding", ...)`) → `useMutation`:

```ts
const onboard = useMutation({
  mutationFn: (body: OnboardingBody) =>
    apiFetch("/users/onboarding", { method: "POST", body }),
  onSuccess: async () => {
    await refresh();          // re-fetches /auth/me, updates store with onboarded:true
    router.replace("/(tabs)/home");
  },
});
```

**Test gate:** Full onboarding flow completes and redirects to home tab.

---

## Phase 15 — Tab Navigator (`src/app/(tabs)/_layout.tsx`)

Copy verbatim from `old-frontend/app/(tabs)/_layout.tsx`. Zero changes needed — imports `COLORS` from `@/src/theme`, uses Ionicons.

---

## Phase 16 — Home Tab (`src/app/(tabs)/home.tsx`)

This is the most complex screen. Replace all `useState`/`useEffect`/`useCallback` data fetching:

| Old | New |
|---|---|
| `const [meals, setMeals] = useState(...)` + `apiFetch("/meals/today")` in `load()` | `const { data: meals, isRefetching } = useMealsToday()` |
| `const [daily, setDaily] = useState(...)` + `apiFetch("/daily/today")` in `load()` | `const { data: daily } = useDailyToday()` |
| `const [plan, setPlan] = useState(...)` + `apiFetch("/plans/current")` in `load()` | `const { data: plan } = useCurrentPlan()` |
| `const [progress, setProgress] = useState(...)` + `apiFetch("/avatar/progress")` in `load()` | `const { data: progress } = useAvatarProgress()` |
| `addWater`: mutate state + fire API, no rollback | `const logWater = useLogWater()` — optimistic with rollback |
| `addSteps`: mutate state + fire API, no rollback | `const logSteps = useLogSteps()` — optimistic with rollback |
| `const [refreshing, setRefreshing] = useState(false)` | `refreshing={isRefetching}` on RefreshControl |
| Manual pull-to-refresh calls `load()` | `onRefresh` calls `refetch()` from any query |
| `const { user } = useAuth()` | `const { user } = useAuthStore()` |

All JSX + StyleSheet: copy verbatim. Only the data-fetching wiring changes.

Safe defaults for null data:
```ts
const meals = mealsData ?? { meals: [], totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 } };
const daily = dailyData ?? { water_glasses: 0, steps: 0 };
const progress = progressData ?? { leanness: 0.5, muscle: 0.5, progress: 0 };
```

**Test gate:** Home screen shows meals, water, steps. Pull to refresh works. Tapping water/steps updates UI instantly then confirms.

---

## Phase 17 — Plans Tab (`src/app/(tabs)/plans.tsx`)

```ts
const { data: plan, isLoading } = useCurrentPlan();
const generate = useGeneratePlan();
```

- Remove `load` callback + `useEffect`
- `generate.mutate()` replaces `apiFetch("/plans/generate", ...)`
- `generate.isPending` replaces `busy` state
- All JSX + StyleSheet verbatim

**Test gate:** Plan displays if exists. Generate button creates a new plan.

---

## Phase 18 — Scan Tab (`src/app/(tabs)/scan.tsx`)

Two fixes on top of copy:

1. **Deprecated API**: `ImagePicker.MediaTypeOptions.Images` → `ImagePicker.MediaType.Images` (both `launchCameraAsync` and `launchImageLibraryAsync` calls)

2. **TanStack Query mutations**:
```ts
const scanMeal = useScanMeal();
const logMeal  = useLogMeal();
```

Replace `scan()` async function body with `scanMeal.mutate(imageB64, { onSuccess: setResult, onError: ... })`.
Replace `logMeal()` async function body with `logMeal.mutate({ name: result.name, ... })`.

All JSX + StyleSheet verbatim.

**Test gate:** Take photo → AI result appears → log meal → success alert.

---

## Phase 19 — Chat Tab (`src/app/(tabs)/chat.tsx`)

One bug fix + TanStack Query:

**Bug fix — quick action race condition:**
Old code: `setInput(a.prompt); setTimeout(send, 80)` — broken.
New code: refactor `send` to accept optional text:
```ts
const send = async (overrideText?: string) => {
  const text = (overrideText ?? input).trim();
  if (!text || sendMsg.isPending) return;
  // ...
};
// In quick actions:
onPress={() => a.route ? router.push(a.route) : send(a.prompt)}
```

**TanStack Query**:
```ts
const sendMsg = useSendMessage();
// inside send():
sendMsg.mutate({ session_id: sessionIdRef.current, message: text }, {
  onSuccess: (r) => setMessages(m => [...m, { role: "assistant", content: r.reply }]),
  onError:   (e) => setMessages(m => [...m, { role: "assistant", content: `(Error: ${e.message})` }]),
});
```

Replace `const [sending, setSending] = useState(false)` with `sendMsg.isPending`.
All JSX + StyleSheet verbatim.

**Test gate:** Typing + sending works. Quick action chips fire messages directly without race condition.

---

## Phase 20 — Profile Tab (`src/app/(tabs)/profile.tsx`)

- Copy verbatim
- `const { user, logout } = useAuth()` → `const { user, logout } = useAuthStore()`
- No data fetching, no TanStack Query needed

**Test gate:** Profile shows user data. Sign out clears state and navigates to login.

---

## Phase 21 — Content Screens

### `src/app/workouts.tsx`
```ts
const { data: videos = [], isLoading } = useWorkoutVideos(type);
```
Remove `useState([]) + useEffect + apiFetch`. JSX verbatim.

### `src/app/recipes.tsx`
```ts
const { data: recipes = [], isLoading } = useRecipes(filter === "all" ? undefined : filter);
```
Remove data state + load effect. JSX verbatim.

### `src/app/recipe/[id].tsx`
```ts
const { id } = useLocalSearchParams<{ id: string }>();
const { data: recipe, isLoading } = useRecipe(id);
```
Remove data state + load effect. JSX verbatim.

### `src/app/gyms.tsx`
```ts
const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
const { data, isLoading } = useGyms(coords);
const gyms = data?.gyms ?? [];
```
Keep `expo-location` permission request to set `coords`. Remove manual fetch. JSX verbatim.

**Test gate:** Each screen loads data from API and renders correctly.

---

## Phase 22 — Subscription Screen (`src/app/subscription.tsx`)

```ts
const { data: plans = [], isLoading } = useSubscriptionPlans();
const createOrder = useCreateOrder();
const verifyPayment = useVerifyPayment();
const { refresh } = useAuthStore();
```

Payment flow:
1. `createOrder.mutate({ plan, currency })` → get `order_id`, `amount`, `key_id`
2. Open Razorpay with those values
3. On Razorpay success callback → `verifyPayment.mutate({ order_id, payment_id, signature })`
4. On verify success → `refresh()` to update user subscription in store

Remove `const [plans, setPlans] = useState([])` + load effect. JSX verbatim.

**Test gate:** Plans list renders. Razorpay sheet opens. (Payment itself requires live key.)

---

## Phase 23 — Settings Screen (`src/app/settings.tsx`)

```ts
const { user, refresh } = useAuthStore();
const { lang, setLang } = useI18nStore();
const updateProfile = useMutation({
  mutationFn: (body) => apiFetch("/users/profile", { method: "PATCH", body }),
  onSuccess: () => refresh(),
});
```

Remove `useAuth()`, `useI18n()`. JSX verbatim. Replace form submit handler with `updateProfile.mutate(...)`.

**Test gate:** Profile fields save. Language toggle persists across restarts.

---

## Phase 24 — Admin Screens

### `src/app/admin.tsx`
```ts
const { data: stats } = useAdminStats();
const { data: users = [] } = useAdminUsers();
const sendNotif = useSendNotification();
const { user } = useAuthStore();
```
Guard: `if (user?.role !== "admin") return router.back()`.
JSX verbatim. Replace all fetch calls with hooks.

### `src/app/admin-recipe.tsx`
```ts
const createRecipe = useCreateRecipe();
```
JSX verbatim. Replace submit handler with mutation.

**Test gate:** Admin screens load stats and user list. Send notification mutates correctly.

---

## Phase 25 — Form Corrector (`src/app/form.tsx`)

```ts
const analyzeForm = useAnalyzeForm();
```

The video upload uses `multipart/form-data` — handled in `useAnalyzeForm` hook directly via `fetch` (not `apiFetch`). JSX verbatim.

**Test gate:** Video picker opens. Analysis returns coaching points.

---

## Phase 26 — Static Screens

### `src/app/terms.tsx`
Copy verbatim. Fix asset/image paths if any.

### `src/app/privacy.tsx`
Copy verbatim.

---

## Phase 27 — Final Cleanup

- Delete `src/app/index.tsx` boilerplate — already replaced in Phase 13
- Add `expo-env.d.ts` to `src/` if TypeScript complains about `process.env.EXPO_PUBLIC_*`
- Verify `tsconfig.json` has path alias: `"@/*": ["./*"]`
- Run `pnpm tsc --noEmit` — should be zero errors
- Run `pnpm expo lint` — fix any lint warnings

---

## Quick Reference: Old → New Mapping

| Old pattern | New pattern |
|---|---|
| `import { useAuth } from "@/src/auth"` | `import { useAuthStore } from "@/src/store/auth"` |
| `const { user, login, logout, refresh } = useAuth()` | `const { user, login, logout, refresh } = useAuthStore()` |
| `import { useI18n } from "@/src/i18n"` | `import { useI18nStore } from "@/src/store/i18n"` |
| `const { t } = useI18n()` | `const { t } = useI18nStore()` |
| `import { apiFetch } from "@/src/api"` | `import { apiFetch } from "@/src/lib/api"` |
| `useState` + `useEffect` + `apiFetch` for reads | `useQuery` from domain hook |
| `useState` + `apiFetch` + manual state update for writes | `useMutation` from domain hook |
| `ImagePicker.MediaTypeOptions.Images` | `ImagePicker.MediaType.Images` |
| `require("../assets/...")` (from `app/`) | `require("../../assets/...")` (from `src/app/`) |

---

## File Structure (final)

```
frontend/
  src/
    app/
      _layout.tsx
      index.tsx
      login.tsx
      signup.tsx
      onboarding.tsx
      terms.tsx
      privacy.tsx
      subscription.tsx
      settings.tsx
      workouts.tsx
      recipes.tsx
      gyms.tsx
      form.tsx
      admin.tsx
      admin-recipe.tsx
      recipe/
        [id].tsx
      (tabs)/
        _layout.tsx
        home.tsx
        plans.tsx
        scan.tsx
        chat.tsx
        profile.tsx
    hooks/
      useSubscription.ts
      usePayments.ts
      usePlans.ts
      useMeals.ts
      useDaily.ts
      useAvatar.ts
      useChat.ts
      useRecipes.ts
      useWorkouts.ts
      useGyms.ts
      useForm.ts
      useAdmin.ts
    lib/
      api.ts
    store/
      auth.ts
      i18n.ts
    provider/
      query.tsx          (already exists)
    types/
      api.ts
      react-native-razorpay.d.ts
    utils/
      storage/
        storage-base.ts
        index.ts
        index.web.ts
    theme.ts
    Avatar.tsx
    PaywallGuard.tsx
    pushNotifications.ts
```
