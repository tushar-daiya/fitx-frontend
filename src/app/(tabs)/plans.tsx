import { useT } from "@/src/store/i18n";
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
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

export default function Plans() {
  const t = useT();
  const router = useRouter();
  const { data: plan, isLoading } = useCurrentPlan();
  const generate = useGeneratePlan();
  const [tab, setTab] = useState<"workout" | "diet">("workout");

  const onGenerate = () => {
    generate.mutate(undefined, {
      onError: (e: any) => Alert.alert(t("b.plans.genFailed"), e.message),
    });
  };

  return (
    <SafeAreaView style={styles.container} testID="plans-screen" edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("b.plans.title")}</Text>
        <TouchableOpacity testID="regen-btn" onPress={onGenerate} disabled={generate.isPending}>
          <Text style={styles.regen}>{generate.isPending ? t("b.plans.generating") : t("b.plans.regen")}</Text>
        </TouchableOpacity>
      </View>

      {(isLoading || generate.isPending) && (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.goldPremium} size="large" />
          <Text style={styles.loadingText}>
            {generate.isPending ? t("b.plans.building") : t("b.plans.loading")}
          </Text>
        </View>
      )}

      {!plan && !isLoading && !generate.isPending && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("b.plans.none")}</Text>
          <Text style={styles.emptySub}>
            {t("b.plans.noneSub")}
          </Text>
          <TouchableOpacity testID="gen-plan-btn" style={styles.primaryBtn} onPress={onGenerate}>
            <Text style={styles.primaryBtnText}>{t("b.plans.gen")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="workouts-empty-link"
            style={styles.secondaryLink}
            onPress={() => router.push("/workouts" as any)}
          >
            <Ionicons name="play-circle-outline" size={18} color={COLORS.goldPremium} />
            <Text style={styles.secondaryLinkText}>{t("b.plans.browse")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan && !generate.isPending && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{plan.plan.summary}</Text>
            <View style={styles.macroBar}>
              <SummaryItem label={t("b.plans.cal")} value={plan.plan.target_calories} />
              <SummaryItem label={t("b.plans.p")} value={`${plan.plan.target_protein_g}g`} />
              <SummaryItem label={t("b.plans.c")} value={`${plan.plan.target_carbs_g}g`} />
              <SummaryItem label={t("b.plans.f")} value={`${plan.plan.target_fats_g}g`} />
            </View>
          </View>

          <TouchableOpacity
            testID="workouts-card"
            activeOpacity={0.85}
            style={styles.videoCard}
            onPress={() => router.push("/workouts" as any)}
          >
            <View style={styles.videoIconBox}>
              <Ionicons name="play-circle" size={32} color={COLORS.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoTitle}>{t("b.plans.videos")}</Text>
              <Text style={styles.videoSub}>{t("b.plans.videosSub")}</Text>
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
                {t("b.plans.workout")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-diet"
              style={[styles.tab, tab === "diet" && styles.tabActive]}
              onPress={() => setTab("diet")}
            >
              <Text style={[styles.tabText, tab === "diet" && styles.tabTextActive]}>{t("b.plans.diet")}</Text>
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
                  {t("b.plans.protein").replace("{kcal}", String(m.calories)).replace("{p}", String(m.protein_g))}
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
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", fontFamily: FONTS.headingBold },
  regen: { color: COLORS.goldPremium, fontWeight: "800", letterSpacing: 1, fontFamily: FONTS.bodyBold },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 14, fontFamily: FONTS.body },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800", fontFamily: FONTS.headingBold },
  emptySub: { color: COLORS.textSecondary, marginTop: 8, textAlign: "center", fontFamily: FONTS.body },
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginTop: 24,
  },
  primaryBtnText: { color: COLORS.onAccent, fontWeight: "800", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  secondaryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
  },
  secondaryLinkText: { color: COLORS.goldPremium, fontWeight: "700", letterSpacing: 0.5, fontFamily: FONTS.bodyBold },
  scroll: { padding: SPACING.l },
  summaryCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    marginBottom: 16,
  },
  summaryText: { color: COLORS.goldPremium, fontSize: 16, fontWeight: "600", fontStyle: "italic", fontFamily: FONTS.bodyMedium },
  macroBar: { flexDirection: "row", marginTop: 16 },
  sLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, fontFamily: FONTS.bodyBold },
  sValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 2, fontFamily: FONTS.headingBold },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: RADIUS.pill },
  tabActive: { backgroundColor: COLORS.goldPremium },
  tabText: { color: COLORS.textSecondary, fontWeight: "800", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  tabTextActive: { color: COLORS.onAccent },
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 18, fontFamily: FONTS.headingBold },
  dayType: { color: COLORS.goldPremium, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  dayFocus: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 10, fontFamily: FONTS.body },
  exerciseRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  exName: { color: COLORS.textPrimary, fontFamily: FONTS.body },
  exMeta: { color: COLORS.goldMuted, fontWeight: "700", fontFamily: FONTS.bodyBold },
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
  videoTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", fontFamily: FONTS.headingBold },
  videoSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
});
