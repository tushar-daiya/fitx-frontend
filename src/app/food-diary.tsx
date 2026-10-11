import { useT } from "@/src/store/i18n";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useMealsForDay, useMealsHistory } from "@/src/hooks/useMeals";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import type { DayNutrition, MealLog, MealType } from "@/src/types/api";

const RANGES = [7, 14, 30] as const;
const CHART_H = 150;
const PAD = { t: 12, b: 20, l: 4, r: 4 };
const TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

// Dates are plain YYYY-MM-DD strings from the server; shift them in UTC so
// the device timezone can't move a day.
const shift = (d: string, n: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });

function Bars({
  days, target, selected, onSelect,
}: { days: DayNutrition[]; target: number | null; selected: string; onSelect: (d: string) => void }) {
  const [w, setW] = useState(0);
  const max = Math.max(...days.map((d) => d.calories), target ?? 0, 1) * 1.1;
  const innerH = CHART_H - PAD.t - PAD.b;
  const slot = w > 0 ? (w - PAD.l - PAD.r) / days.length : 0;
  const bar = Math.max(3, slot * 0.62);
  const y = (v: number) => PAD.t + (1 - v / max) * innerH;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: CHART_H }}>
      {w > 0 && (
        <Svg width={w} height={CHART_H}>
          {target != null && (
            <Line x1={PAD.l} x2={w - PAD.r} y1={y(target)} y2={y(target)} stroke={COLORS.success} strokeDasharray="5 5" strokeWidth={1} />
          )}
          {days.map((d, i) => {
            const x = PAD.l + i * slot + (slot - bar) / 2;
            const h = Math.max(d.calories > 0 ? 2 : 0, (d.calories / max) * innerH);
            const over = target != null && d.calories > target;
            return (
              <React.Fragment key={d.date}>
                {/* Wide transparent hit area so thin bars are easy to tap */}
                <Rect x={PAD.l + i * slot} y={0} width={slot} height={CHART_H} fill="transparent" onPress={() => onSelect(d.date)} />
                <Rect
                  x={x} y={PAD.t + innerH - h} width={bar} height={h} rx={3}
                  fill={d.date === selected ? COLORS.goldPremium : over ? COLORS.warning : COLORS.goldMuted}
                  opacity={d.date === selected ? 1 : 0.55}
                  onPress={() => onSelect(d.date)}
                />
              </React.Fragment>
            );
          })}
          <SvgText x={PAD.l} y={CHART_H - 4} fill={COLORS.textMuted} fontSize={10}>{fmt(days[0].date, { day: "numeric", month: "short" })}</SvgText>
          <SvgText x={w - PAD.r} y={CHART_H - 4} fill={COLORS.textMuted} fontSize={10} textAnchor="end">
            {fmt(days[days.length - 1].date, { day: "numeric", month: "short" })}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

export default function FoodDiary() {
  const t = useT();
  const router = useRouter();
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const history = useMealsHistory(range);
  const [selected, setSelected] = useState<string | null>(null);

  const h = history.data;
  const today = h?.today ?? "";
  const date = selected ?? today;
  // Keep the selection inside the chart's window when the range changes.
  useEffect(() => {
    if (h && selected && !h.days.some((d) => d.date === selected)) setSelected(null);
  }, [h, selected]);

  const day = useMealsForDay(date);
  const meals = day.data?.meals ?? [];
  const totals = day.data?.totals;
  const target = h?.target_calories ?? null;

  const logged = h?.days.filter((d) => d.calories > 0) ?? [];
  const avg = logged.length ? Math.round(logged.reduce((a, d) => a + d.calories, 0) / logged.length) : 0;
  const pct = target && totals ? Math.min(1, totals.calories / target) : 0;
  const isToday = date === today;

  return (
    <SafeAreaView style={styles.container} testID="food-diary-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("b.fd.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      {history.isLoading || !h ? (
        <ActivityIndicator color={COLORS.goldPremium} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.rangeChip, range === r && styles.rangeChipActive]}>
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{t("b.fd.days").replace("{n}", String(r))}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.card}>
            <Bars days={h.days} target={target} selected={date} onSelect={setSelected} />
          </View>
          <Text style={styles.avg}>
            {logged.length ? t(logged.length > 1 ? "b.fd.avgMany" : "b.fd.avgOne").replace("{avg}", String(avg)).replace("{n}", String(logged.length)) : t("b.fd.noMeals")}
            {target ? t("b.fd.target").replace("{n}", String(target)) : ""}
          </Text>

          <View style={styles.dayNav}>
            <TouchableOpacity testID="diary-prev" onPress={() => setSelected(shift(date, -1))} disabled={date <= h.days[0].date} hitSlop={10}>
              <Ionicons name="chevron-back-circle" size={30} color={date <= h.days[0].date ? COLORS.textMuted : COLORS.goldPremium} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.dayTitle}>{isToday ? t("b.fd.today") : fmt(date, { weekday: "long" })}</Text>
              <Text style={styles.daySub}>{fmt(date, { day: "numeric", month: "long", year: "numeric" })}</Text>
            </View>
            <TouchableOpacity testID="diary-next" onPress={() => setSelected(shift(date, 1))} disabled={isToday} hitSlop={10}>
              <Ionicons name="chevron-forward-circle" size={30} color={isToday ? COLORS.textMuted : COLORS.goldPremium} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalCal}>{Math.round(totals?.calories ?? 0)}</Text>
              <Text style={styles.totalUnit}>{target ? t("b.fd.ofTarget").replace("{n}", String(target)) : "kcal"}</Text>
            </View>
            {target ? (
              <View style={styles.bar}><View style={[styles.barFill, { width: `${pct * 100}%` }]} /></View>
            ) : null}
            <View style={styles.macros}>
              <Macro label={t("b.fd.protein")} v={totals?.protein_g} />
              <Macro label={t("b.fd.carbs")} v={totals?.carbs_g} />
              <Macro label={t("b.fd.fats")} v={totals?.fats_g} />
            </View>
          </View>

          <TouchableOpacity
            testID="diary-add"
            style={styles.addBtn}
            onPress={() => router.push((isToday ? "/log-meal" : `/log-meal?date=${date}`) as any)}
          >
            <Ionicons name="add" size={20} color={COLORS.onAccent} />
            <Text style={styles.addText}>{isToday ? t("b.fd.add") : t("b.fd.addDay")}</Text>
          </TouchableOpacity>

          {day.isLoading ? (
            <ActivityIndicator color={COLORS.goldPremium} style={{ marginTop: 16 }} />
          ) : meals.length === 0 ? (
            <Text style={styles.empty}>{t("b.fd.none")}</Text>
          ) : (
            TYPES.map((mt) => {
              const group = meals.filter((m) => m.meal_type === mt);
              if (!group.length) return null;
              return (
                <View key={mt}>
                  <Text style={styles.section}>
                    {t(`b.meal.${mt}`).toUpperCase()} · {Math.round(group.reduce((a, m) => a + m.calories, 0))} KCAL
                  </Text>
                  {group.map((m) => <MealRow key={m.id} m={m} onPress={() => router.push((isToday ? "/log-meal" : `/log-meal?date=${date}`) as any)} />)}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Macro({ label, v }: { label: string; v?: number }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(v ?? 0)}g</Text>
    </View>
  );
}

function MealRow({ m, onPress }: { m: MealLog; onPress: () => void }) {
  const t = useT();
  return (
    <TouchableOpacity style={styles.meal} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealName} numberOfLines={1}>{m.name}</Text>
        <Text style={styles.mealSub}>P {Math.round(m.protein_g)}g · C {Math.round(m.carbs_g)}g · F {Math.round(m.fats_g)}g{m.source === "manual" ? ` · ${t("b.meal.manual")}` : ""}</Text>
      </View>
      <Text style={styles.mealCal}>{Math.round(m.calories)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.l },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", fontFamily: FONTS.headingBold },
  scroll: { padding: SPACING.l, paddingTop: 0, paddingBottom: 40 },
  rangeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  rangeChipActive: { backgroundColor: COLORS.goldPremium, borderColor: COLORS.goldPremium },
  rangeText: { color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 1 },
  rangeTextActive: { color: COLORS.onAccent },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.m },
  avg: { color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 12, textAlign: "center", marginTop: 8 },
  dayNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 18 },
  dayTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.headingBold },
  daySub: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.body, marginTop: 2 },
  totalRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  totalCal: { color: COLORS.goldPremium, fontSize: 40, fontFamily: FONTS.headingBold },
  totalUnit: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  bar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, backgroundColor: COLORS.goldPremium, borderRadius: 3 },
  macros: { flexDirection: "row", gap: 8, marginTop: 14 },
  macro: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, padding: 10, alignItems: "center" },
  macroLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, fontFamily: FONTS.bodyBold },
  macroValue: { color: COLORS.textPrimary, fontSize: 17, marginTop: 2, fontFamily: FONTS.headingBold },
  addBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: COLORS.goldPremium, borderRadius: RADIUS.pill, paddingVertical: 14, marginTop: 14 },
  addText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, fontFamily: FONTS.body, textAlign: "center", marginTop: 24 },
  section: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontFamily: FONTS.bodyBold, marginTop: 20, marginBottom: 8 },
  meal: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.m, marginBottom: 8 },
  mealName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bodyBold, textTransform: "capitalize" },
  mealSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  mealCal: { color: COLORS.goldPremium, fontSize: 18, fontFamily: FONTS.headingBold },
});
