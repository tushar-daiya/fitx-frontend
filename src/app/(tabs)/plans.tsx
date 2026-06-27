import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCurrentPlan, useGeneratePlan } from "@/src/hooks/usePlans";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function Plans() {
  const router = useRouter();
  const { data: plan, isLoading } = useCurrentPlan();
  const generate = useGeneratePlan();
  const [tab, setTab] = useState<"workout" | "diet">("workout");

  const onGenerate = () => {
    generate.mutate(undefined, {
      onError: (e: any) => Alert.alert("Generation failed", e.message),
    });
  };

  return (
    <SafeAreaView style={styles.container} testID="plans-screen" edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Plans</Text>
        <TouchableOpacity testID="regen-btn" onPress={onGenerate} disabled={generate.isPending}>
          <Text style={styles.regen}>{generate.isPending ? "GENERATING..." : "REGENERATE"}</Text>
        </TouchableOpacity>
      </View>

      {(isLoading || generate.isPending) && (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.goldPremium} size="large" />
          <Text style={styles.loadingText}>
            {generate.isPending ? "Building your personalized AI plan..." : "Loading..."}
          </Text>
        </View>
      )}

      {!plan && !isLoading && !generate.isPending && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptySub}>
            Generate a personalized workout + diet plan powered by GPT-4o
          </Text>
          <TouchableOpacity testID="gen-plan-btn" style={styles.primaryBtn} onPress={onGenerate}>
            <Text style={styles.primaryBtnText}>GENERATE PLAN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="workouts-empty-link"
            style={styles.secondaryLink}
            onPress={() => router.push("/workouts" as any)}
          >
            <Ionicons name="play-circle-outline" size={18} color={COLORS.goldPremium} />
            <Text style={styles.secondaryLinkText}>Browse Workout Videos</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan && !generate.isPending && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{plan.plan.summary}</Text>
            <View style={styles.macroBar}>
              <SummaryItem label="CAL" value={plan.plan.target_calories} />
              <SummaryItem label="P" value={`${plan.plan.target_protein_g}g`} />
              <SummaryItem label="C" value={`${plan.plan.target_carbs_g}g`} />
              <SummaryItem label="F" value={`${plan.plan.target_fats_g}g`} />
            </View>
          </View>

          <TouchableOpacity
            testID="workouts-card"
            activeOpacity={0.85}
            style={styles.videoCard}
            onPress={() => router.push("/workouts" as any)}
          >
            <View style={styles.videoIconBox}>
              <Ionicons name="play-circle" size={32} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoTitle}>Workout Videos</Text>
              <Text style={styles.videoSub}>Home & Gym · Step-by-step demos</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.goldPremium} />
          </TouchableOpacity>

          <View style={styles.tabBar}>
            <TouchableOpacity
              testID="tab-workout"
              style={[styles.tab, tab === "workout" && styles.tabActive]}
              onPress={() => setTab("workout")}
            >
              <Text style={[styles.tabText, tab === "workout" && styles.tabTextActive]}>
                WORKOUT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-diet"
              style={[styles.tab, tab === "diet" && styles.tabActive]}
              onPress={() => setTab("diet")}
            >
              <Text style={[styles.tabText, tab === "diet" && styles.tabTextActive]}>DIET</Text>
            </TouchableOpacity>
          </View>

          {tab === "workout" &&
            (plan.plan.workout_plan || []).map((day, i) => (
              <View key={i} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.day}</Text>
                  <Text style={styles.dayType}>{day.type?.toUpperCase()}</Text>
                </View>
                <Text style={styles.dayFocus}>{day.focus}</Text>
                {(day.exercises || []).map((ex, j) => (
                  <View key={j} style={styles.exerciseRow}>
                    <Text style={styles.exName}>• {ex.name}</Text>
                    <Text style={styles.exMeta}>
                      {ex.sets}x{ex.reps}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

          {tab === "diet" &&
            (plan.plan.diet_plan || []).map((m, i) => (
              <View key={i} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{m.meal}</Text>
                  <Text style={styles.dayType}>{m.time}</Text>
                </View>
                {(m.items || []).map((it, j) => (
                  <Text key={j} style={styles.exName}>
                    • {it}
                  </Text>
                ))}
                <Text style={styles.dayFocus}>
                  {m.calories} kcal · {m.protein_g}g protein
                </Text>
              </View>
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryItem({ label, value }: { label: string; value: any }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.sLabel}>{label}</Text>
      <Text style={styles.sValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  regen: { color: COLORS.goldPremium, fontWeight: "800", letterSpacing: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  emptySub: { color: COLORS.textSecondary, marginTop: 8, textAlign: "center" },
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginTop: 24,
  },
  primaryBtnText: { color: "#000", fontWeight: "800", letterSpacing: 1.5 },
  secondaryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
  },
  secondaryLinkText: { color: COLORS.goldPremium, fontWeight: "700", letterSpacing: 0.5 },
  scroll: { padding: SPACING.l },
  summaryCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    marginBottom: 16,
  },
  summaryText: { color: COLORS.goldPremium, fontSize: 16, fontWeight: "600", fontStyle: "italic" },
  macroBar: { flexDirection: "row", marginTop: 16 },
  sLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  sValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: RADIUS.pill },
  tabActive: { backgroundColor: COLORS.goldPremium },
  tabText: { color: COLORS.textSecondary, fontWeight: "800", letterSpacing: 1.5 },
  tabTextActive: { color: "#000" },
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { color: "#fff", fontWeight: "800", fontSize: 18 },
  dayType: { color: COLORS.goldPremium, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  dayFocus: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 10 },
  exerciseRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  exName: { color: "#fff" },
  exMeta: { color: COLORS.goldMuted, fontWeight: "700" },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
    marginBottom: 16,
  },
  videoIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
  },
  videoTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  videoSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
