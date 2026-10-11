import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRecipes } from "@/src/hooks/useRecipes";
import type { DietType } from "@/src/types/api";
import { useT } from "@/src/store/i18n";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

const FILTERS = ["all", "veg", "non_veg", "eggetarian", "vegan", "jain"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: "c.rec.f_all",
  veg: "c.rec.f_veg",
  non_veg: "c.rec.f_non_veg",
  eggetarian: "c.rec.f_eggetarian",
  vegan: "c.rec.f_vegan",
  jain: "c.rec.f_jain",
};

export default function Recipes() {
  const router = useRouter();
  const t = useT();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: recipes = [], isLoading } = useRecipes(
    filter === "all" ? undefined : (filter as DietType)
  );

  return (
    <SafeAreaView style={styles.container} testID="recipes-screen" edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("c.rec.title")}</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            onPress={() => setFilter(f)}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(FILTER_LABELS[f])}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.goldPremium} size="large" />
          <Text style={styles.loadingText}>{t("c.rec.loading")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {recipes.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>{t("c.rec.none")}</Text>
              <Text style={styles.emptyText}>{t("c.rec.try_filter")}</Text>
            </View>
          )}
          {recipes.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              testID={`recipe-${r.id}`}
              activeOpacity={0.85}
              onPress={() => router.push(`/recipe/${r.id}` as any)}
            >
              {r.image_url ? (
                <Image source={{ uri: r.image_url }} style={styles.cardImg} />
              ) : (
                <View style={styles.cardImgPlaceholder}>
                  <Ionicons name="restaurant-outline" size={36} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.cardOverlay} />
              <View style={styles.cardBody}>
                <View style={styles.dietPill}>
                  <Text style={styles.dietPillText}>
                    {FILTER_LABELS[r.diet as Filter] ? t(FILTER_LABELS[r.diet as Filter]) : r.diet} · {r.cuisine}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.macroRow}>
                  <MacroTag label="kcal" value={Math.round(r.calories)} />
                  <MacroTag label="P" value={`${r.protein_g}g`} />
                  <MacroTag label="C" value={`${r.carbs_g}g`} />
                  <MacroTag label="F" value={`${r.fats_g}g`} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MacroTag({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.macroTag}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    fontFamily: FONTS.headingBold,
  },

  // Filters
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filters: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterPillActive: {
    backgroundColor: COLORS.goldPremium,
    borderColor: COLORS.goldPremium,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: FONTS.bodyMedium,
  },
  filterTextActive: { color: COLORS.onAccent, fontWeight: "800", fontFamily: FONTS.bodyBold },

  // Loading / empty
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 14,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  emptyWrap: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
    fontFamily: FONTS.headingSemiBold,
  },
  emptyText: { color: COLORS.textSecondary, marginTop: 6, fontFamily: FONTS.body },

  // List
  list: { paddingHorizontal: SPACING.l, paddingBottom: 40, gap: 16 },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardImg: { width: "100%", height: 180 },
  cardImgPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  cardBody: { padding: SPACING.m, gap: 6 },
  dietPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  dietPillText: {
    color: COLORS.goldPremium,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: FONTS.bodyBold,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
    fontFamily: FONTS.headingSemiBold,
  },
  macroRow: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  macroTag: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  macroLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  macroValue: {
    color: COLORS.goldPremium,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
    fontFamily: FONTS.bodyBold,
  },
});
