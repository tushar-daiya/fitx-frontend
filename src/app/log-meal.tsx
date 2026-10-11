import { useT } from "@/src/store/i18n";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useDeleteMeal,
  useLogMeal,
  useMealsForDay,
  useMealsToday,
  useUpdateMeal,
} from "@/src/hooks/useMeals";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import type { MealLog, MealType } from "@/src/types/api";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const EMPTY = { name: "", calories: "", protein: "", carbs: "", fats: "" };

const fmtLong = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

const num = (v: string) => (v.trim() === "" ? 0 : parseFloat(v));

export default function LogMeal() {
  const t = useT();
  const router = useRouter();
  // Opened from the food diary for a past day: log into / edit that day.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const todayQ = useMealsToday();
  const dayQ = useMealsForDay(date ?? "", !!date);
  const today = date ? dayQ : todayQ;
  const logMeal = useLogMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  const [form, setForm] = useState(EMPTY);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [editing, setEditing] = useState<MealLog | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});

  const set = (key: keyof typeof EMPTY, numeric = true) => (v: string) => {
    setErrors((e) => ({ ...e, [key]: undefined }));
    setForm((f) => ({ ...f, [key]: numeric ? v.replace(/[^0-9.]/g, "") : v }));
  };

  const reset = () => {
    setForm(EMPTY);
    setMealType("snack");
    setEditing(null);
    setErrors({});
  };

  const startEdit = (m: MealLog) => {
    setEditing(m);
    setMealType(m.meal_type);
    setErrors({});
    setForm({
      name: m.name,
      calories: String(Math.round(m.calories)),
      protein: String(m.protein_g || ""),
      carbs: String(m.carbs_g || ""),
      fats: String(m.fats_g || ""),
    });
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = t("b.lm.enterName");
    const cal = parseFloat(form.calories);
    if (isNaN(cal) || cal < 0 || cal > 20000) e.calories = t("b.lm.errCal");
    for (const [k, label] of [["protein", "b.lm.errProtein"], ["carbs", "b.lm.errCarbs"], ["fats", "b.lm.errFats"]] as const) {
      const v = num(form[k]);
      if (isNaN(v) || v < 0 || v > 2000) e[k] = t(label);
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    const body = {
      name: form.name.trim(),
      calories: parseFloat(form.calories),
      protein_g: num(form.protein),
      carbs_g: num(form.carbs),
      fats_g: num(form.fats),
      meal_type: mealType,
    };
    const done = reset;
    const onError = (e: any) => Alert.alert(t("b.lm.cantSave"), e.message);
    if (editing) updateMeal.mutate({ id: editing.id, ...body }, { onSuccess: done, onError });
    else logMeal.mutate({ ...body, source: "manual", date }, { onSuccess: done, onError });
  };

  const onDelete = (m: MealLog) =>
    Alert.alert(t("b.lm.delQ"), m.name, [
      { text: t("b.lm.cancel"), style: "cancel" },
      {
        text: t("b.lm.delete"),
        style: "destructive",
        onPress: () => {
          if (editing?.id === m.id) reset();
          deleteMeal.mutate(m.id, { onError: (e: any) => Alert.alert(t("b.lm.cantDelete"), e.message) });
        },
      },
    ]);

  const busy = logMeal.isPending || updateMeal.isPending;
  const meals = today.data?.meals ?? [];
  const totals = today.data?.totals;

  return (
    <SafeAreaView style={styles.container} testID="log-meal-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{date ? fmtLong(date) : t("b.lm.title")}</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>{editing ? t("b.lm.edit") : date ? t("b.lm.addDay") : t("b.lm.what")}</Text>
          <Field label={t("b.lm.foodName")} tid="manual-name" value={form.name} onChange={set("name", false)} error={errors.name} placeholder={t("b.lm.foodPh")} keyboard="default" />
          <Field label={t("b.lm.cal")} tid="manual-calories" value={form.calories} onChange={set("calories")} error={errors.calories} placeholder={t("b.lm.calPh")} />
          <View style={styles.macroRow}>
            <View style={{ flex: 1 }}>
              <Field label={t("b.lm.protein")} tid="manual-protein" value={form.protein} onChange={set("protein")} error={errors.protein} placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("b.lm.carbs")} tid="manual-carbs" value={form.carbs} onChange={set("carbs")} error={errors.carbs} placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("b.lm.fats")} tid="manual-fats" value={form.fats} onChange={set("fats")} error={errors.fats} placeholder="0" />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t("b.lm.meal")}</Text>
          <View style={styles.chips}>
            {MEAL_TYPES.map((mt) => (
              <TouchableOpacity
                key={mt}
                testID={`manual-type-${mt}`}
                onPress={() => setMealType(mt)}
                style={[styles.chip, mealType === mt && styles.chipActive]}
              >
                <Text style={[styles.chipText, mealType === mt && styles.chipTextActive]}>{t(`b.meal.${mt}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity testID="manual-save" style={styles.primary} onPress={onSave} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={COLORS.onAccent} />
            ) : (
              <Text style={styles.primaryText}>{editing ? t("b.lm.saveChanges") : date ? t("b.lm.addMeal") : t("b.lm.addToday")}</Text>
            )}
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity onPress={reset} style={{ alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.bodyBold }}>{t("b.lm.cancelEdit")}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.section, { marginTop: 28 }]}>
            {date ? t("b.lm.meals") : t("b.lm.todayMeals")}{totals ? ` · ${Math.round(totals.calories)} KCAL` : ""}
          </Text>
          {today.isLoading ? (
            <ActivityIndicator color={COLORS.goldPremium} />
          ) : meals.length === 0 ? (
            <Text style={styles.empty}>{t("b.lm.none")}</Text>
          ) : (
            meals.map((m) => (
              <TouchableOpacity key={m.id} testID={`meal-${m.id}`} style={styles.meal} onPress={() => startEdit(m)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.mealSub}>
                    {t(`b.meal.${m.meal_type}`)} · P {Math.round(m.protein_g)}g · C {Math.round(m.carbs_g)}g · F {Math.round(m.fats_g)}g
                    {m.source === "manual" ? ` · ${t("b.meal.manual")}` : ""}
                  </Text>
                </View>
                <Text style={styles.mealCal}>{Math.round(m.calories)}</Text>
                <TouchableOpacity onPress={() => onDelete(m)} hitSlop={10} style={{ marginLeft: 12 }}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, tid, error, placeholder, keyboard = "decimal-pad",
}: {
  label: string; value: string; onChange: (v: string) => void; tid: string;
  error?: string; placeholder?: string; keyboard?: "default" | "decimal-pad";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={tid}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboard}
        maxLength={keyboard === "default" ? 120 : 7}
        style={[styles.field, !!error && { borderColor: COLORS.error }]}
      />
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.l },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", fontFamily: FONTS.headingBold },
  scroll: { padding: SPACING.l, paddingTop: 0, paddingBottom: 40 },
  section: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontFamily: FONTS.bodyBold, marginBottom: 10 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6, fontFamily: FONTS.body },
  field: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  errText: { color: COLORS.error, fontSize: 12, marginTop: 4, fontFamily: FONTS.bodyMedium },
  macroRow: { flexDirection: "row", gap: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.goldPremium, borderColor: COLORS.goldPremium },
  chipText: { color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, textTransform: "capitalize", fontSize: 13 },
  chipTextActive: { color: COLORS.onAccent },
  primary: { backgroundColor: COLORS.goldPremium, borderRadius: RADIUS.pill, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  primaryText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  meal: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.m, marginBottom: 8,
  },
  mealName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bodyBold, textTransform: "capitalize" },
  mealSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body, textTransform: "capitalize" },
  mealCal: { color: COLORS.goldPremium, fontSize: 18, fontFamily: FONTS.headingBold },
});
