import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth";
import { track } from "@/src/lib/analytics";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type OnboardingBody = {
  gender: "male" | "female" | "other";
  age: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  goal: string;
  level: string;
  diet: string;
};

const GOALS = [
  { id: "fat_loss", label: "Fat Loss" },
  { id: "lean_bulk", label: "Lean Bulk" },
  { id: "body_recomp", label: "Body Recomp" },
];
const LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];
const DIETS = [
  { id: "veg", label: "Vegetarian" },
  { id: "non_veg", label: "Non-Vegetarian" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
];

const LIMITS = {
  age:    { min: 10,  max: 100, unit: "years" },
  height: { min: 50,  max: 300, unit: "cm" },
  weight: { min: 20,  max: 500, unit: "kg" },
  target: { min: 20,  max: 500, unit: "kg" },
};

function numErr(
  raw: string,
  key: keyof typeof LIMITS,
  label: string
): string | null {
  const v = parseFloat(raw);
  if (!raw.trim() || isNaN(v)) return `${label} is required`;
  const { min, max, unit } = LIMITS[key];
  if (v < min || v > max)
    return `${label} must be between ${min} and ${max} ${unit}`;
  return null;
}

export default function Onboarding() {
  const router = useRouter();
  const { refresh } = useAuthStore();
  const [step, setStep] = useState<Step>(0);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("75");
  const [target, setTarget] = useState("70");
  const [goal, setGoal] = useState("fat_loss");
  const [level, setLevel] = useState("beginner");
  const [diet, setDiet] = useState("veg");
  const [err, setErr] = useState<string | null>(null);

  const onboard = useMutation({
    mutationFn: (body: OnboardingBody) =>
      apiFetch("/users/onboarding", { method: "POST", body }),
    onSuccess: async () => {
      track("onboarding_complete", { goal, level, diet, gender });
      await refresh();
      // No plan is granted at signup — send the user to the trial screen to
      // explicitly start their free trial before entering the app.
      router.replace("/start-trial");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const validateStep = (): boolean => {
    let e: string | null = null;
    if (step === 1) e = numErr(age, "age", "Age");
    if (step === 2) e = numErr(height, "height", "Height");
    if (step === 3) {
      e = numErr(weight, "weight", "Current weight");
      if (!e) e = numErr(target, "target", "Target weight");
    }
    if (step === 4) {
      const w = parseFloat(weight);
      const t = parseFloat(target);
      if (goal === "fat_loss" && t >= w)
        e = "Target weight should be less than current weight for fat loss";
      if (goal === "lean_bulk" && t <= w)
        e = "Target weight should be greater than current weight for lean bulk";
    }
    setErr(e);
    return e === null;
  };

  const next = () => {
    if (!validateStep()) return;
    setErr(null);
    track("onboarding_step", { step, next_step: Math.min(6, step + 1) });
    setStep((s) => (Math.min(6, s + 1) as Step));
  };

  const back = () => {
    setErr(null);
    setStep((s) => (Math.max(0, s - 1) as Step));
  };

  const submit = () => {
    onboard.mutate({
      gender,
      age: parseInt(age, 10) || 25,
      height_cm: parseFloat(height),
      weight_kg: parseFloat(weight),
      target_weight_kg: parseFloat(target),
      goal,
      level,
      diet,
    });
  };

  const Option = ({ active, label, onPress, tid }: any) => (
    <TouchableOpacity
      testID={tid}
      onPress={onPress}
      style={[styles.opt, active && styles.optActive]}
    >
      <Text style={[styles.optText, active && styles.optTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const NumField = ({
    testID: tid,
    value,
    onChange,
    placeholder,
    label,
    hint,
  }: {
    testID: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    label?: string;
    hint?: string;
  }) => (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        testID={tid}
        value={value}
        onChangeText={(v) => {
          setErr(null);
          onChange(v.replace(/[^0-9.]/g, ""));
        }}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        maxLength={6}
      />
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.progressRow}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, step >= i && styles.progressDotActive]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View>
              <Text style={styles.q}>What's your gender?</Text>
              <Text style={styles.qSub}>Helps us personalize your plan</Text>
              {(["male", "female", "other"] as const).map((g) => (
                <Option
                  key={g}
                  tid={`onb-gender-${g}`}
                  label={g.charAt(0).toUpperCase() + g.slice(1)}
                  active={gender === g}
                  onPress={() => setGender(g)}
                />
              ))}
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.q}>How old are you?</Text>
              <Text style={styles.qSub}>Enter your age in years</Text>
              <NumField
                testID="onb-age"
                value={age}
                onChange={setAge}
                placeholder="25"
                hint={`${LIMITS.age.min}–${LIMITS.age.max} years`}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.q}>Your height?</Text>
              <Text style={styles.qSub}>In centimeters</Text>
              <NumField
                testID="onb-height"
                value={height}
                onChange={setHeight}
                placeholder="175"
                hint={`${LIMITS.height.min}–${LIMITS.height.max} cm`}
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.q}>Your weight?</Text>
              <Text style={styles.qSub}>We'll track your progress over time</Text>
              <NumField
                testID="onb-weight"
                value={weight}
                onChange={setWeight}
                placeholder="75"
                label="Current weight (kg)"
                hint={`${LIMITS.weight.min}–${LIMITS.weight.max} kg`}
              />
              <NumField
                testID="onb-target"
                value={target}
                onChange={setTarget}
                placeholder="70"
                label="Target weight (kg)"
                hint={`${LIMITS.target.min}–${LIMITS.target.max} kg`}
              />
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.q}>Your goal?</Text>
              <Text style={styles.qSub}>What do you want to achieve</Text>
              {GOALS.map((g) => (
                <Option
                  key={g.id}
                  tid={`onb-goal-${g.id}`}
                  label={g.label}
                  active={goal === g.id}
                  onPress={() => setGoal(g.id)}
                />
              ))}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.q}>Fitness level?</Text>
              <Text style={styles.qSub}>Your training experience</Text>
              {LEVELS.map((l) => (
                <Option
                  key={l.id}
                  tid={`onb-level-${l.id}`}
                  label={l.label}
                  active={level === l.id}
                  onPress={() => setLevel(l.id)}
                />
              ))}
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={styles.q}>Diet preference?</Text>
              <Text style={styles.qSub}>We'll personalize meals for you</Text>
              {DIETS.map((d) => (
                <Option
                  key={d.id}
                  tid={`onb-diet-${d.id}`}
                  label={d.label}
                  active={diet === d.id}
                  onPress={() => setDiet(d.id)}
                />
              ))}
            </View>
          )}

          {err && (
            <View style={styles.errBanner}>
              <Text style={styles.errText}>{err}</Text>
            </View>
          )}
        </ScrollView>

        <SafeAreaView edges={["bottom"]}>
          <View style={styles.footer}>
            {step > 0 && (
              <TouchableOpacity testID="onb-back" onPress={back} style={styles.backBtn}>
                <Text style={styles.backBtnText}>BACK</Text>
              </TouchableOpacity>
            )}
            {step < 6 ? (
              <TouchableOpacity testID="onb-next" onPress={next} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>CONTINUE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="onb-finish"
                onPress={submit}
                style={styles.primaryBtn}
                disabled={onboard.isPending}
              >
                {onboard.isPending ? (
                  <ActivityIndicator color={COLORS.onAccent} />
                ) : (
                  <Text style={styles.primaryBtnText}>FINISH</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  progressRow: { flexDirection: "row", gap: 6, padding: SPACING.l },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
  progressDotActive: { backgroundColor: COLORS.goldPremium },
  scroll: { padding: SPACING.l, paddingBottom: 120 },
  q: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: FONTS.headingBold,
  },
  qSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
    fontFamily: FONTS.body,
  },
  opt: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 12,
  },
  optActive: { borderColor: COLORS.goldPremium, backgroundColor: COLORS.goldTint },
  optText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONTS.bodyBold,
  },
  optTextActive: { color: COLORS.goldPremium },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
    fontFamily: FONTS.bodyBold,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: FONTS.bodyBold,
  },
  inputHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: FONTS.body,
  },
  errBanner: {
    backgroundColor: COLORS.errorTint,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 8,
  },
  errText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    padding: SPACING.l,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: COLORS.onAccent,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontFamily: FONTS.bodyBold,
  },
  backBtn: {
    paddingHorizontal: 28,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyBold },
});
