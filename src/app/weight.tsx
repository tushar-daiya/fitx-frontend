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
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { useDeleteWeight, useLogWeight, useWeightHistory } from "@/src/hooks/useWeight";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import type { WeightEntry } from "@/src/types/api";

const CHART_H = 180;
const PAD = { l: 38, r: 12, t: 14, b: 22 };

const dayMs = (d: string) => new Date(`${d}T00:00:00`).getTime();
const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function Chart({ items, target }: { items: WeightEntry[]; target: number | null }) {
  const [w, setW] = useState(0);
  if (items.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.muted}>Log your weight again later to see your trend.</Text>
      </View>
    );
  }
  const weights = items.map((i) => i.weight_kg);
  const lo = Math.min(...weights, target ?? Infinity) - 1;
  const hi = Math.max(...weights, target ?? -Infinity) + 1;
  const t0 = dayMs(items[0].date);
  const span = Math.max(1, dayMs(items[items.length - 1].date) - t0);
  const innerW = Math.max(1, w - PAD.l - PAD.r);
  const innerH = CHART_H - PAD.t - PAD.b;
  const x = (d: string) => PAD.l + ((dayMs(d) - t0) / span) * innerW;
  const y = (kg: number) => PAD.t + (1 - (kg - lo) / (hi - lo)) * innerH;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: CHART_H }}>
      {w > 0 && (
        <Svg width={w} height={CHART_H}>
          {target != null && (
            <>
              <Line x1={PAD.l} x2={w - PAD.r} y1={y(target)} y2={y(target)} stroke={COLORS.success} strokeDasharray="5 5" strokeWidth={1} />
              <SvgText x={PAD.l - 6} y={y(target) + 4} fill={COLORS.success} fontSize={10} textAnchor="end">{target}</SvgText>
            </>
          )}
          <Polyline
            points={items.map((i) => `${x(i.date)},${y(i.weight_kg)}`).join(" ")}
            fill="none" stroke={COLORS.goldPremium} strokeWidth={2.5} strokeLinejoin="round"
          />
          {items.map((i) => (
            <Circle key={i.id} cx={x(i.date)} cy={y(i.weight_kg)} r={3.5} fill={COLORS.goldPremium} />
          ))}
          <SvgText x={PAD.l} y={CHART_H - 4} fill={COLORS.textMuted} fontSize={10}>{fmtDay(items[0].date)}</SvgText>
          <SvgText x={w - PAD.r} y={CHART_H - 4} fill={COLORS.textMuted} fontSize={10} textAnchor="end">
            {fmtDay(items[items.length - 1].date)}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

export default function Weight() {
  const router = useRouter();
  const history = useWeightHistory();
  const logWeight = useLogWeight();
  const deleteWeight = useDeleteWeight();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const h = history.data;
  const items = h?.items ?? [];
  const start = h?.start_weight_kg ?? null;
  const current = h?.current_weight_kg ?? null;
  const target = h?.target_weight_kg ?? null;
  const change = start != null && current != null ? current - start : null;

  const onSave = () => {
    const kg = parseFloat(value);
    if (isNaN(kg) || kg < 20 || kg > 500) return setError("Enter a weight between 20 and 500 kg");
    setError(null);
    logWeight.mutate(kg, {
      onSuccess: () => setValue(""),
      onError: (e: any) => Alert.alert("Couldn't save", e.message),
    });
  };

  const onDelete = (e: WeightEntry) =>
    Alert.alert("Delete entry?", `${e.weight_kg} kg on ${fmtDay(e.date)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteWeight.mutate(e.id, { onError: (err: any) => Alert.alert("Couldn't delete", err.message) }),
      },
    ]);

  return (
    <SafeAreaView style={styles.container} testID="weight-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Weight Log</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {history.isLoading ? (
            <ActivityIndicator color={COLORS.goldPremium} />
          ) : (
            <>
              <View style={styles.statsRow}>
                <Stat label="START" value={start != null ? `${start} kg` : "—"} />
                <Stat label="NOW" value={current != null ? `${current} kg` : "—"} />
                <Stat label="GOAL" value={target != null ? `${target} kg` : "—"} />
              </View>
              {change != null && items.length > 1 && (
                <Text style={styles.changeText}>
                  {change === 0 ? "No change yet" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg since you started`}
                </Text>
              )}

              <View style={styles.card}>
                <Chart items={items} target={target} />
              </View>

              <Text style={styles.section}>LOG TODAY'S WEIGHT</Text>
              <View style={styles.inputRow}>
                <TextInput
                  testID="weight-input"
                  value={value}
                  onChangeText={(v) => { setError(null); setValue(v.replace(/[^0-9.]/g, "")); }}
                  placeholder={current != null ? String(current) : "e.g. 72.5"}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  style={[styles.input, !!error && { borderColor: COLORS.error }]}
                />
                <TouchableOpacity testID="weight-save" style={styles.saveBtn} onPress={onSave} disabled={logWeight.isPending}>
                  {logWeight.isPending ? <ActivityIndicator color={COLORS.onAccent} /> : <Text style={styles.saveText}>SAVE</Text>}
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.errText}>{error}</Text> : null}
              <Text style={styles.hint}>Logging again on the same day replaces that day's entry. Your progress and calorie target use your latest weight.</Text>

              <Text style={styles.section}>HISTORY</Text>
              {[...items].reverse().map((e) => (
                <View key={e.id} style={styles.row}>
                  <Text style={styles.rowDate}>{fmtDay(e.date)}</Text>
                  <Text style={styles.rowWeight}>{e.weight_kg} kg</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => onDelete(e)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={19} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.l },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", fontFamily: FONTS.headingBold },
  scroll: { padding: SPACING.l, paddingTop: 0, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.m },
  statLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  statValue: { color: COLORS.textPrimary, fontSize: 20, marginTop: 4, fontFamily: FONTS.headingBold },
  changeText: { color: COLORS.goldMuted, fontFamily: FONTS.bodyMedium, marginTop: 10, textAlign: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.s, marginTop: 14 },
  chartEmpty: { height: 100, alignItems: "center", justifyContent: "center" },
  muted: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  section: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontFamily: FONTS.bodyBold, marginTop: 24, marginBottom: 10 },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 14, color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.bodyBold,
  },
  saveBtn: { backgroundColor: COLORS.goldPremium, borderRadius: RADIUS.pill, paddingHorizontal: 28, justifyContent: "center", alignItems: "center" },
  saveText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
  errText: { color: COLORS.error, fontSize: 12, marginTop: 6, fontFamily: FONTS.bodyMedium },
  hint: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8, fontFamily: FONTS.body },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.m, paddingVertical: 14, marginBottom: 8,
  },
  rowDate: { flex: 1, color: COLORS.textSecondary, fontFamily: FONTS.body },
  rowWeight: { color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, fontSize: 16, marginRight: 16 },
});
