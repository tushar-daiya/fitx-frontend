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
  phone: string | null;
  is_phone_verified: boolean;
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

export type PreAuthResponse = {
  pre_auth_token: string;
  phone_verification_required?: true;
  phone: string | null;
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

export type ActivateSubscriptionResponse = {
  ok: boolean;
  starts_at: string;
  ends_at: string;
};

// ── Payments ──────────────────────────────────────────────────────────────
export type PaymentOrder = {
  order_id: string;
  amount: number;
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

// ── Push Notifications ────────────────────────────────────────────────────
export type DeviceTokenResponse = {
  ok: boolean;
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
