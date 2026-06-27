import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRecipe } from "@/src/hooks/useRecipes";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: recipe, isLoading, error } = useRecipe(id ?? "");

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.error}>{(error as any).message}</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !recipe) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={COLORS.goldPremium} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="recipe-detail" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroWrap}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, { backgroundColor: COLORS.surface2 }]} />
          )}
          <View style={styles.heroOverlay} />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaTag}>
              {(recipe.diet || "").replace("_", " ").toUpperCase()}
            </Text>
            <Text style={styles.metaTag}>{recipe.cuisine || "Indian"}</Text>
          </View>

          <View style={styles.macroBar}>
            <Macro label="KCAL" value={Math.round(recipe.calories)} />
            <Macro label="PROTEIN" value={`${recipe.protein_g}g`} />
            <Macro label="CARBS" value={`${recipe.carbs_g}g`} />
            <Macro label="FATS" value={`${recipe.fats_g}g`} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INGREDIENTS</Text>
            {(recipe.ingredients || []).map((ing, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{ing}</Text>
              </View>
            ))}
            {(recipe.ingredients || []).length === 0 && (
              <Text style={styles.muted}>No ingredients listed.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOW TO COOK</Text>
            {(recipe.steps || []).map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            {(recipe.steps || []).length === 0 && (
              <Text style={styles.muted}>No steps listed.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value }: { label: string; value: any }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.mLabel}>{label}</Text>
      <Text style={styles.mValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  error: { color: "#EF4444", padding: 32, textAlign: "center" },
  heroWrap: { position: "relative" },
  hero: { width: "100%", height: 320, backgroundColor: COLORS.surface2 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: SPACING.l },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 16 },
  metaTag: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.goldPremium,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  macroBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  mValue: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4 },
  section: { marginTop: 28 },
  sectionTitle: {
    color: COLORS.goldPremium,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.goldPremium, marginTop: 8 },
  bulletText: { color: "#fff", fontSize: 15, flex: 1, lineHeight: 22 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14, gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#000", fontWeight: "900" },
  stepText: { color: "#fff", fontSize: 15, flex: 1, lineHeight: 22 },
  muted: { color: COLORS.textMuted, fontStyle: "italic" },
});
