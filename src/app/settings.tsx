import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth";
import { useI18nStore } from "@/src/store/i18n";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

const GOALS = ["fat_loss", "lean_bulk", "body_recomp"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const DIETS = ["veg", "non_veg", "eggetarian", "vegan", "jain"];
const GENDERS = ["male", "female", "other"];

const LIMITS = {
  age:    { min: 10,  max: 100, label: "Age",           unit: "years" },
  height: { min: 50,  max: 300, label: "Height",        unit: "cm" },
  weight: { min: 20,  max: 500, label: "Weight",        unit: "kg" },
  target: { min: 20,  max: 500, label: "Target weight", unit: "kg" },
};

type LimitKey = keyof typeof LIMITS;

function validateNumericField(raw: string, key: LimitKey): string | null {
  const v = parseFloat(raw);
  if (!raw.trim() || isNaN(v)) return `${LIMITS[key].label} is required`;
  const { min, max, unit, label } = LIMITS[key];
  if (v < min || v > max) return `${label} must be between ${min} and ${max} ${unit}`;
  return null;
}

export default function Settings() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, refresh, changePhoneRequest } = useAuthStore();
  const { lang, setLang, t } = useI18nStore();
  const p = user?.profile;
  const [changingPhone, setChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);

  const onChangePhone = async () => {
    if (!newPhone.trim()) return Alert.alert("Required", "Enter your new phone number");
    setPhoneBusy(true);
    try {
      const fullPhone = `+91${newPhone.trim()}`;
      await changePhoneRequest(fullPhone);
      setChangingPhone(false);
      router.push({
        pathname: "/verify-otp",
        params: { phone: fullPhone, purpose: "phone_change" },
      });
    } catch (e: any) {
      Alert.alert("Could not send code", e.message);
    } finally {
      setPhoneBusy(false);
    }
  };
  const [form, setForm] = useState<{
    gender: string; age: string; height_cm: string; weight_kg: string;
    target_weight_kg: string; goal: string; level: string; diet: string;
  }>({
    gender: p?.gender || "male",
    age: String(p?.age || 25),
    height_cm: String(p?.height_cm || 175),
    weight_kg: String(p?.weight_kg || 75),
    target_weight_kg: String(p?.target_weight_kg || 70),
    goal: p?.goal || "fat_loss",
    level: p?.level || "beginner",
    diet: p?.diet || "veg",
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LimitKey, string>>>({});

  // Accounts that predate the flag count as opted in.
  const marketingOn = user?.marketing_opt_in !== false;
  const setMarketing = useMutation({
    mutationFn: (marketing_opt_in: boolean) =>
      apiFetch("/users/marketing", { method: "PATCH", body: { marketing_opt_in } }),
    onSuccess: () => refresh(),
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const updateProfile = useMutation({
    mutationFn: (body: object) => apiFetch("/users/profile", { method: "PATCH", body }),
    onSuccess: async () => {
      await refresh();
      // A changed weight is logged as a weigh-in, so progress and history move too.
      qc.invalidateQueries({ queryKey: ["avatar-progress"] });
      qc.invalidateQueries({ queryKey: ["weight-history"] });
      Alert.alert("Saved", "Your preferences have been updated");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const save = () => {
    const errors: Partial<Record<LimitKey, string>> = {};
    const ageErr    = validateNumericField(form.age,              "age");
    const heightErr = validateNumericField(form.height_cm,        "height");
    const weightErr = validateNumericField(form.weight_kg,        "weight");
    const targetErr = validateNumericField(form.target_weight_kg, "target");
    if (ageErr)    errors.age    = ageErr;
    if (heightErr) errors.height = heightErr;
    if (weightErr) errors.weight = weightErr;
    if (targetErr) errors.target = targetErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    updateProfile.mutate({
      gender: form.gender,
      age: parseInt(form.age, 10),
      height_cm: parseFloat(form.height_cm),
      weight_kg: parseFloat(form.weight_kg),
      target_weight_kg: parseFloat(form.target_weight_kg),
      goal: form.goal,
      level: form.level,
      diet: form.diet,
    });
  };

  const Chip = ({ active, label, onPress, tid }: any) => (
    <TouchableOpacity
      testID={tid}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label.replace("_", " ")}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} testID="settings-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>ACCOUNT</Text>
          <View style={styles.linkCard}>
            <View>
              <Text style={styles.linkLabel}>Phone number</Text>
              <Text style={styles.linkSub}>
                {user?.phone || "Not set"} · {user?.is_phone_verified ? "Verified" : "Unverified"}
              </Text>
            </View>
            <TouchableOpacity testID="change-phone-toggle" onPress={() => setChangingPhone((v) => !v)}>
              <Text style={{ color: COLORS.goldPremium, fontFamily: FONTS.bodyBold, fontSize: 13 }}>
                {changingPhone ? "Cancel" : "Change"}
              </Text>
            </TouchableOpacity>
          </View>
          {changingPhone && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row" }}>
                <View style={styles.phonePrefix}>
                  <Text style={{ color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, fontSize: 16 }}>+91</Text>
                </View>
                <TextInput
                  testID="change-phone-input"
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={newPhone}
                  onChangeText={(v) => setNewPhone(v.replace(/[^0-9]/g, ""))}
                  style={[styles.field, { flex: 1 }]}
                />
              </View>
              <TouchableOpacity
                testID="change-phone-submit"
                style={[styles.cta, { marginTop: 10 }]}
                onPress={onChangePhone}
                disabled={phoneBusy}
              >
                {phoneBusy ? (
                  <ActivityIndicator color={COLORS.onAccent} />
                ) : (
                  <Text style={styles.ctaText}>SEND VERIFICATION CODE</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.linkCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.linkLabel}>WhatsApp offers & updates</Text>
              <Text style={styles.linkSub}>Receive occasional offers and news from FitX on WhatsApp</Text>
            </View>
            <Switch
              testID="marketing-toggle"
              value={marketingOn}
              disabled={setMarketing.isPending}
              onValueChange={(v) => setMarketing.mutate(v)}
              trackColor={{ true: COLORS.goldPremium, false: COLORS.surface2 }}
            />
          </View>

          <Text style={styles.section}>GENDER</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => (
              <Chip
                key={g}
                tid={`set-gender-${g}`}
                label={g}
                active={form.gender === g}
                onPress={() => setForm({ ...form, gender: g })}
              />
            ))}
          </View>

          <Text style={styles.section}>BODY METRICS</Text>
          <Field
            label={`Age (${LIMITS.age.min}–${LIMITS.age.max} yrs)`}
            value={form.age}
            tid="set-age"
            error={fieldErrors.age}
            onChange={(v) => { setFieldErrors((e) => ({ ...e, age: undefined })); setForm({ ...form, age: v.replace(/[^0-9]/g, "") }); }}
          />
          <Field
            label={`Height (${LIMITS.height.min}–${LIMITS.height.max} cm)`}
            value={form.height_cm}
            tid="set-height"
            error={fieldErrors.height}
            onChange={(v) => { setFieldErrors((e) => ({ ...e, height: undefined })); setForm({ ...form, height_cm: v.replace(/[^0-9.]/g, "") }); }}
          />
          <Field
            label={`Weight (${LIMITS.weight.min}–${LIMITS.weight.max} kg)`}
            value={form.weight_kg}
            tid="set-weight"
            error={fieldErrors.weight}
            onChange={(v) => { setFieldErrors((e) => ({ ...e, weight: undefined })); setForm({ ...form, weight_kg: v.replace(/[^0-9.]/g, "") }); }}
          />
          <Field
            label={`Target Weight (${LIMITS.target.min}–${LIMITS.target.max} kg)`}
            value={form.target_weight_kg}
            tid="set-target"
            error={fieldErrors.target}
            onChange={(v) => { setFieldErrors((e) => ({ ...e, target: undefined })); setForm({ ...form, target_weight_kg: v.replace(/[^0-9.]/g, "") }); }}
          />

          <Text style={styles.section}>GOAL</Text>
          <View style={styles.row}>
            {GOALS.map((g) => (
              <Chip
                key={g}
                tid={`set-goal-${g}`}
                label={g}
                active={form.goal === g}
                onPress={() => setForm({ ...form, goal: g })}
              />
            ))}
          </View>

          <Text style={styles.section}>WORKOUT LEVEL</Text>
          <View style={styles.row}>
            {LEVELS.map((l) => (
              <Chip
                key={l}
                tid={`set-level-${l}`}
                label={l}
                active={form.level === l}
                onPress={() => setForm({ ...form, level: l })}
              />
            ))}
          </View>

          <Text style={styles.section}>DIET PREFERENCE</Text>
          <View style={styles.row}>
            {DIETS.map((d) => (
              <Chip
                key={d}
                tid={`set-diet-${d}`}
                label={d}
                active={form.diet === d}
                onPress={() => setForm({ ...form, diet: d })}
              />
            ))}
          </View>

          <Text style={styles.section}>SUBSCRIPTION</Text>
          <TouchableOpacity
            testID="manage-sub"
            style={styles.linkCard}
            onPress={() => router.push("/subscription" as any)}
          >
            <View>
              <Text style={styles.linkLabel}>Manage Subscription</Text>
              <Text style={styles.linkSub}>
                Current: {(user?.subscription || "trial").toUpperCase()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.goldPremium} />
          </TouchableOpacity>

          <Text style={styles.section}>{t("lang.label")}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              testID="lang-en"
              onPress={() => setLang("en")}
              style={[styles.chip, lang === "en" && styles.chipActive]}
            >
              <Text style={[styles.chipText, lang === "en" && styles.chipTextActive]}>
                {t("lang.english")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="lang-hi"
              onPress={() => setLang("hi")}
              style={[styles.chip, lang === "hi" && styles.chipActive]}
            >
              <Text style={[styles.chipText, lang === "hi" && styles.chipTextActive]}>
                {t("lang.hindi")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>LEGAL</Text>
          <TouchableOpacity
            testID="open-privacy"
            style={styles.linkCard}
            onPress={() => router.push("/privacy" as any)}
          >
            <View>
              <Text style={styles.linkLabel}>Privacy Policy</Text>
              <Text style={styles.linkSub}>How we handle your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.goldPremium} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="open-terms"
            style={styles.linkCard}
            onPress={() => router.push("/terms" as any)}
          >
            <View>
              <Text style={styles.linkLabel}>Terms of Service</Text>
              <Text style={styles.linkSub}>Usage agreement</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.goldPremium} />
          </TouchableOpacity>
          <Text style={styles.versionText}>FitX · v1.0.0</Text>
        </ScrollView>
        <SafeAreaView edges={["bottom"]}>
          <View style={styles.footer}>
            <TouchableOpacity
              testID="save-settings"
              style={styles.cta}
              onPress={save}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={COLORS.onAccent} />
              ) : (
                <Text style={styles.ctaText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  tid,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tid: string;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={tid}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[styles.field, !!error && styles.fieldError]}
        placeholderTextColor={COLORS.textMuted}
        maxLength={6}
      />
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.l,
  },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", fontFamily: FONTS.headingBold },
  scroll: { padding: SPACING.l, paddingBottom: 40 },
  section: {
    color: COLORS.goldMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
    marginTop: 16,
    marginBottom: 10,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.goldPremium, borderColor: COLORS.goldPremium },
  chipText: { color: COLORS.textPrimary, fontWeight: "700", fontFamily: FONTS.bodyBold, textTransform: "capitalize", fontSize: 13 },
  chipTextActive: { color: COLORS.onAccent },
  fieldWrap: { marginBottom: 12 },
  phonePrefix: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    justifyContent: "center",
    marginRight: 8,
  },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6, fontFamily: FONTS.body },
  field: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
  },
  fieldError: { borderColor: COLORS.error },
  errText: { color: COLORS.error, fontSize: 12, marginTop: 4, fontWeight: "600", fontFamily: FONTS.bodyMedium },
  linkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    padding: SPACING.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  linkLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700", fontFamily: FONTS.bodyBold },
  linkSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
    letterSpacing: 1.5,
    fontFamily: FONTS.body,
  },
  footer: { padding: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.border },
  cta: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: COLORS.onAccent, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
});
