import { useT } from "@/src/store/i18n";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store/auth";
import { Avatar } from "@/src/Avatar";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import { useMealsToday } from "@/src/hooks/useMeals";
import { useDailyToday, useLogWater, useLogSteps } from "@/src/hooks/useDaily";
import { useCurrentPlan } from "@/src/hooks/usePlans";
import { useAvatarProgress } from "@/src/hooks/useAvatar";
import { useStepsSync } from "@/src/hooks/useStepsSync";
import { HEALTH_CONNECT_STORE_URL } from "@/src/lib/steps";

export default function Home() {
  const t = useT();
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: mealsData, isRefetching, refetch } = useMealsToday();
  const { data: dailyData } = useDailyToday();
  const { data: plan } = useCurrentPlan();
  const { data: progressData } = useAvatarProgress();

  const logWater = useLogWater();
  const logSteps = useLogSteps();

  const meals = mealsData ?? { meals: [], totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 } };
  const daily = dailyData ?? { water_glasses: 0, steps: 0, date: "" };
  const progress = progressData ?? { leanness: 0.5, muscle: 0.5, progress: 0 };

  const addWater = () => {
    const next = Math.min(20, (daily.water_glasses || 0) + 1);
    logWater.mutate(next);
  };
  const stepsSync = useStepsSync(daily.steps || 0);
  const autoSteps = stepsSync.status === "ready";
  const onStepsPress = async () => {
    if (autoSteps) return; // tracked automatically
    if (stepsSync.status === "needs_permission") {
      const s = await stepsSync.enable();
      if (s !== "ready") Alert.alert(t("b.home.stepsOff"), t("b.home.stepsOffMsg"));
      return;
    }
    if (stepsSync.status === "needs_install") {
      return Alert.alert(
        t("b.home.hcNeeded"),
        t("b.home.hcMsg"),
        [{ text: t("b.home.notNow"), style: "cancel" }, { text: t("b.home.openStore"), onPress: () => Linking.openURL(HEALTH_CONNECT_STORE_URL) }],
      );
    }
    logSteps.mutate((daily.steps || 0) + 1000); // no step source on this device
  };
  const stepsHint =
    autoSteps ? t("b.home.auto")
    : stepsSync.status === "needs_permission" ? t("b.home.enableSteps")
    : stepsSync.status === "needs_install" ? t("b.home.setupHC")
    : t("b.home.add1k");

  const target = meals.target_calories || plan?.plan?.target_calories || 2200;
  const calPct = Math.min(1, meals.totals.calories / target);
  const waterPct = Math.min(1, (daily.water_glasses || 0) / 8);
  const stepsPct = Math.min(1, (daily.steps || 0) / 10000);

  return (
    <SafeAreaView style={styles.container} testID="home-screen" edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={COLORS.goldPremium}
            onRefresh={refetch}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>{t("b.home.hello")}</Text>
            <Text style={styles.name}>{user?.name || t("b.home.champion")}</Text>
          </View>
          <View style={styles.brandPill}>
            <Text style={styles.brandText}>FitX</Text>
          </View>
        </View>

        {/* Hero avatar */}
        <TouchableOpacity testID="progress-card" activeOpacity={0.85} onPress={() => router.push("/weight" as any)} style={styles.heroCard}>
          <Avatar
            gender={user?.profile?.gender || "male"}
            leanness={progress.leanness}
            muscle={progress.muscle}
            size={180}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.heroLabel}>{t("b.home.progress")}</Text>
            <Text style={styles.heroValue}>
              {(progress.progress * 100).toFixed(0)}%
            </Text>
            <Text style={styles.heroSub}>{t("b.home.toward").replace("{kg}", String(user?.profile?.target_weight_kg || "—"))}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress * 100}%` }]} />
            </View>
            <Text style={styles.daysText}>
              {t("b.home.day").replace("{n}", String((progress as any).days || 1))} · {(progress as any).goal?.replace("_", " ") || ""}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Calorie ring */}
        <TouchableOpacity testID="nutrition-card" activeOpacity={0.85} onPress={() => router.push("/food-diary" as any)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.caption}>{t("b.home.nutrition")}</Text>
            <Text style={styles.target}>{Math.round(meals.totals.calories)} / {target} kcal</Text>
          </View>
          <View style={styles.ringBar}>
            <View style={[styles.ringFill, { width: `${calPct * 100}%` }]} />
          </View>
          <View style={styles.macroRow}>
            <MacroChip label={t("b.home.protein")} value={`${Math.round(meals.totals.protein_g)}g`} />
            <MacroChip label={t("b.home.carbs")} value={`${Math.round(meals.totals.carbs_g)}g`} />
            <MacroChip label={t("b.home.fats")} value={`${Math.round(meals.totals.fats_g)}g`} />
          </View>
        </TouchableOpacity>

        {/* Water + Steps grid */}
        <View style={styles.grid}>
          <TouchableOpacity testID="water-card" style={styles.gridCard} onPress={addWater}>
            <Ionicons name="water" size={28} color={COLORS.goldPremium} />
            <Text style={styles.gridVal}>{daily.water_glasses || 0}/8</Text>
            <Text style={styles.gridLabel}>{t("b.home.water")}</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniFill, { width: `${waterPct * 100}%` }]} />
            </View>
            <Text style={styles.addHint}>{t("b.home.addWater")}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="steps-card" style={styles.gridCard} onPress={onStepsPress} activeOpacity={autoSteps ? 1 : 0.7}>
            <Ionicons name="walk" size={28} color={COLORS.goldPremium} />
            <Text style={styles.gridVal}>{(daily.steps || 0).toLocaleString()}</Text>
            <Text style={styles.gridLabel}>{t("b.home.steps")}</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniFill, { width: `${stepsPct * 100}%` }]} />
            </View>
            <Text style={styles.addHint}>{stepsHint}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            testID="quick-scan"
            style={styles.actionBtn}
            onPress={() => router.push("/(tabs)/scan" as any)}
          >
            <Ionicons name="camera" size={20} color={COLORS.onAccent} />
            <Text style={styles.actionBtnText}>{t("b.home.scanMeal")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="quick-log"
            style={styles.actionBtnAlt}
            onPress={() => router.push("/log-meal" as any)}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.goldPremium} />
            <Text style={styles.actionBtnAltText}>{t("b.home.logFood")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="quick-recipes"
            style={styles.actionBtnAlt}
            onPress={() => router.push("/recipes" as any)}
          >
            <Ionicons name="restaurant" size={20} color={COLORS.goldPremium} />
            <Text style={styles.actionBtnAltText}>{t("b.home.recipes")}</Text>
          </TouchableOpacity>
        </View>

        {!plan && (
          <TouchableOpacity
            testID="generate-plan-cta"
            style={styles.heroCTA}
            onPress={() => router.push("/(tabs)/plans" as any)}
          >
            <Text style={styles.heroCTATitle}>{t("b.home.genTitle")}</Text>
            <Text style={styles.heroCTASub}>
              {t("b.home.genSub")}
            </Text>
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>{t("b.home.genNow")}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.l, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  hi: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.body },
  name: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", fontFamily: FONTS.headingBold },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
  },
  brandText: { color: COLORS.goldPremium, fontWeight: "900", letterSpacing: 2, fontFamily: FONTS.headingBold },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    padding: SPACING.m,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroLabel: { color: COLORS.goldMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: "700", fontFamily: FONTS.bodyBold },
  heroValue: { color: COLORS.goldPremium, fontSize: 42, fontWeight: "900", marginTop: 4, fontFamily: FONTS.headingBold },
  heroSub: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 4, marginTop: 12 },
  progressFill: { height: 6, backgroundColor: COLORS.goldPremium, borderRadius: 4 },
  daysText: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, textTransform: "uppercase", letterSpacing: 1, fontFamily: FONTS.body },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  caption: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: "700", fontFamily: FONTS.bodyBold },
  target: { color: COLORS.textPrimary, fontWeight: "700", fontFamily: FONTS.bodyBold },
  ringBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginTop: 14,
    overflow: "hidden",
  },
  ringFill: { height: 10, backgroundColor: COLORS.goldPremium },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  chip: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: "center",
    borderRadius: RADIUS.md,
  },
  chipLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: "700", fontFamily: FONTS.bodyBold },
  chipValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", marginTop: 2, fontFamily: FONTS.headingBold },
  grid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridVal: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 10, fontFamily: FONTS.headingBold },
  gridLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: "700", fontFamily: FONTS.bodyBold },
  miniBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 10 },
  miniFill: { height: 4, backgroundColor: COLORS.goldPremium },
  addHint: { color: COLORS.goldMuted, fontSize: 10, marginTop: 8, fontFamily: FONTS.body },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { color: COLORS.onAccent, fontWeight: "800", letterSpacing: 1, fontFamily: FONTS.bodyBold },
  actionBtnAlt: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "transparent",
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
  },
  actionBtnAltText: { color: COLORS.goldPremium, fontWeight: "800", letterSpacing: 1, fontFamily: FONTS.bodyBold },
  heroCTA: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
  },
  heroCTATitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", fontFamily: FONTS.headingBold },
  heroCTASub: { color: COLORS.textSecondary, marginTop: 4, fontFamily: FONTS.body },
  heroBtn: { marginTop: 16, alignSelf: "flex-start" },
  heroBtnText: { color: COLORS.goldPremium, fontWeight: "800", letterSpacing: 1, fontFamily: FONTS.bodyBold },
});
