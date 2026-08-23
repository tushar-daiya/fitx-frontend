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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCreateRecipe } from "@/src/hooks/useRecipes";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

const DIETS = ["veg", "non_veg", "eggetarian", "vegan", "jain"];

const RECIPE_LIMITS = {
  calories:  { min: 1,   max: 5000, label: "Calories",  unit: "kcal" },
  protein_g: { min: 0,   max: 500,  label: "Protein",   unit: "g" },
  carbs_g:   { min: 0,   max: 1000, label: "Carbs",     unit: "g" },
  fats_g:    { min: 0,   max: 500,  label: "Fats",      unit: "g" },
};

function validateRecipeField(raw: string, key: keyof typeof RECIPE_LIMITS): string | null {
  if (!raw.trim()) return key === "calories" ? `${RECIPE_LIMITS[key].label} is required` : null;
  const v = parseFloat(raw);
  if (isNaN(v)) return `${RECIPE_LIMITS[key].label} must be a number`;
  const { min, max, unit, label } = RECIPE_LIMITS[key];
  if (v < min || v > max) return `${label} must be ${min}–${max} ${unit}`;
  return null;
}

export default function AdminRecipe() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof RECIPE_LIMITS, string>>>({});
  const [form, setForm] = useState({
    title: "",
    diet: "veg",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fats_g: "",
    cuisine: "Indian",
    ingredients: "",
    steps: "",
    image_url: "",
  });

  const save = () => {
    if (!form.title.trim()) return Alert.alert("Title is required");
    const errors: Partial<Record<keyof typeof RECIPE_LIMITS, string>> = {};
    const calErr  = validateRecipeField(form.calories,  "calories");
    const protErr = validateRecipeField(form.protein_g, "protein_g");
    const carbErr = validateRecipeField(form.carbs_g,   "carbs_g");
    const fatErr  = validateRecipeField(form.fats_g,    "fats_g");
    if (calErr)  errors.calories  = calErr;
    if (protErr) errors.protein_g = protErr;
    if (carbErr) errors.carbs_g   = carbErr;
    if (fatErr)  errors.fats_g    = fatErr;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    createRecipe.mutate(
      {
        title: form.title,
        diet: form.diet as any,
        calories: parseFloat(form.calories) || 0,
        protein_g: parseFloat(form.protein_g) || 0,
        carbs_g: parseFloat(form.carbs_g) || 0,
        fats_g: parseFloat(form.fats_g) || 0,
        cuisine: form.cuisine,
        ingredients: form.ingredients
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        steps: form.steps
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        image_url: form.image_url || "",
      },
      {
        onSuccess: () => {
          Alert.alert("Saved", "Recipe added to library");
          router.back();
        },
        onError: (e: any) => Alert.alert("Error", e.message),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="admin-recipe-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>New Recipe</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field
            label="TITLE"
            value={form.title}
            tid="rec-title"
            onChange={(v) => setForm({ ...form, title: v })}
          />
          <Text style={styles.section}>DIET</Text>
          <View style={styles.row}>
            {DIETS.map((d) => (
              <TouchableOpacity
                key={d}
                testID={`rec-diet-${d}`}
                onPress={() => setForm({ ...form, diet: d })}
                style={[styles.chip, form.diet === d && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.diet === d && styles.chipTextActive]}>
                  {d.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.grid}>
            <Field
              label={`CAL (1–5000)`}
              value={form.calories}
              tid="rec-cal"
              numeric
              error={fieldErrors.calories}
              onChange={(v) => { setFieldErrors((e) => ({ ...e, calories: undefined })); setForm({ ...form, calories: v }); }}
            />
            <Field
              label={`PROTEIN g (0–500)`}
              value={form.protein_g}
              tid="rec-prot"
              numeric
              error={fieldErrors.protein_g}
              onChange={(v) => { setFieldErrors((e) => ({ ...e, protein_g: undefined })); setForm({ ...form, protein_g: v }); }}
            />
            <Field
              label={`CARBS g (0–1000)`}
              value={form.carbs_g}
              tid="rec-carbs"
              numeric
              error={fieldErrors.carbs_g}
              onChange={(v) => { setFieldErrors((e) => ({ ...e, carbs_g: undefined })); setForm({ ...form, carbs_g: v }); }}
            />
            <Field
              label={`FATS g (0–500)`}
              value={form.fats_g}
              tid="rec-fats"
              numeric
              error={fieldErrors.fats_g}
              onChange={(v) => { setFieldErrors((e) => ({ ...e, fats_g: undefined })); setForm({ ...form, fats_g: v }); }}
            />
          </View>

          <Field
            label="CUISINE"
            value={form.cuisine}
            tid="rec-cuisine"
            onChange={(v) => setForm({ ...form, cuisine: v })}
          />
          <Field
            label="IMAGE URL (optional)"
            value={form.image_url}
            tid="rec-img"
            onChange={(v) => setForm({ ...form, image_url: v })}
          />

          <Text style={styles.section}>INGREDIENTS (1 per line)</Text>
          <TextInput
            testID="rec-ingredients"
            multiline
            value={form.ingredients}
            onChangeText={(v) => setForm({ ...form, ingredients: v })}
            style={[styles.field, { minHeight: 100 }]}
            placeholder={"200g paneer\nOnion 1\nYogurt 50g"}
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.section}>STEPS (1 per line)</Text>
          <TextInput
            testID="rec-steps"
            multiline
            value={form.steps}
            onChangeText={(v) => setForm({ ...form, steps: v })}
            style={[styles.field, { minHeight: 100 }]}
            placeholder={"Marinate paneer 30 min\nGrill 12 min"}
            placeholderTextColor={COLORS.textMuted}
          />
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            testID="rec-save"
            onPress={save}
            disabled={createRecipe.isPending}
            style={styles.cta}
          >
            {createRecipe.isPending ? (
              <ActivityIndicator color={COLORS.onAccent} />
            ) : (
              <Text style={styles.ctaText}>SAVE RECIPE</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  tid,
  numeric,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tid: string;
  numeric?: boolean;
  error?: string;
}) {
  return (
    <View style={{ flex: 1, marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={tid}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={[styles.field, !!error && styles.fieldError]}
        placeholderTextColor={COLORS.textMuted}
        maxLength={numeric ? 7 : undefined}
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
    marginTop: 12,
    marginBottom: 8,
    fontFamily: FONTS.bodyBold,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.goldPremium, borderColor: COLORS.goldPremium },
  chipText: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 12, textTransform: "capitalize", fontFamily: FONTS.bodyBold },
  chipTextActive: { color: COLORS.onAccent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 4, letterSpacing: 1, fontWeight: "700", fontFamily: FONTS.bodyBold },
  field: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.body,
  },
  footer: { padding: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.border },
  cta: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: COLORS.onAccent, fontWeight: "900", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  fieldError: { borderColor: COLORS.error },
  errText: { color: COLORS.error, fontSize: 11, marginTop: 3, fontWeight: "600", fontFamily: FONTS.bodyMedium },
});
