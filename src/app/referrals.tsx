import { useT } from "@/src/store/i18n";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useReferralList, useReferralSummary } from "@/src/hooks/useReferrals";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import type { ReferralEarningsByCurrency } from "@/src/types/api";

const SYMBOL: Record<string, string> = { INR: "₹", USD: "$" };
const money = (cur: string, v: number) =>
  `${SYMBOL[cur] ?? cur + " "}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function totalLabel(e: ReferralEarningsByCurrency, key: "pending" | "paid") {
  const parts = Object.entries(e)
    .filter(([, v]) => v[key] > 0)
    .map(([cur, v]) => money(cur, v[key]));
  return parts.length ? parts.join(" + ") : money("INR", 0);
}

export default function Referrals() {
  const t = useT();
  const router = useRouter();
  const summary = useReferralSummary();
  const list = useReferralList();
  const s = summary.data;

  const shareText = s
    ? t("b.r.share").replace("{code}", s.code) + `${
        s.link ? `\n${s.link}` : ""
      }`
    : "";

  const copy = async () => {
    if (!s) return;
    await Clipboard.setStringAsync(s.code);
    Alert.alert(t("b.r.copied"), t("b.r.copiedMsg"));
  };

  return (
    <SafeAreaView style={styles.container} testID="referrals-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("b.r.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      {summary.isLoading ? (
        <ActivityIndicator color={COLORS.goldPremium} style={{ marginTop: 40 }} />
      ) : !s ? (
        <Text style={styles.empty}>{t("b.r.loadFail")}</Text>
      ) : !s.enabled ? (
        <Text style={styles.empty}>{t("b.r.off")}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{t("b.r.heroTitle").replace("{pct}", String(s.commission_pct))}</Text>
            <Text style={styles.heroSub}>
              {t("b.r.heroSub").replace("{pct}", String(s.commission_pct))}
            </Text>
            <Text style={styles.codeLabel}>{t("b.r.yourCode")}</Text>
            <TouchableOpacity testID="referral-code" onPress={copy} style={styles.codeBox}>
              <Text style={styles.code}>{s.code}</Text>
              <Ionicons name="copy-outline" size={20} color={COLORS.goldPremium} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="referral-share"
              style={styles.primary}
              onPress={() => Share.share({ message: shareText })}
            >
              <Ionicons name="share-social" size={18} color={COLORS.onAccent} />
              <Text style={styles.primaryText}>{t("b.r.shareBtn")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <Stat label={t("b.r.joined")} value={String(s.signed_up)} />
            <Stat label={t("b.r.purchased")} value={String(s.converted)} />
          </View>
          <View style={styles.statsRow}>
            <Stat label={t("b.r.pending")} value={totalLabel(s.earnings, "pending")} />
            <Stat label={t("b.r.paid")} value={totalLabel(s.earnings, "paid")} />
          </View>
          <Text style={styles.note}>
            {t("b.r.note")}
          </Text>

          <Text style={styles.section}>{t("b.r.yourRefs")}</Text>
          {list.isLoading ? (
            <ActivityIndicator color={COLORS.goldPremium} />
          ) : !list.data?.items.length ? (
            <Text style={styles.empty}>{t("b.r.none")}</Text>
          ) : (
            list.data.items.map((r, i) => (
              <View key={i} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{r.name}</Text>
                  <Text style={styles.rowSub}>
                    {t("b.r.joinedOn").replace("{date}", new Date(r.joined_at).toLocaleDateString())} ·{" "}
                    {r.purchases ? t(r.purchases > 1 ? "b.r.purchMany" : "b.r.purchOne").replace("{n}", String(r.purchases)) : t("b.r.purchNone")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {r.earned.map((e, j) => (
                    <Text key={j} style={[styles.earn, e.status === "paid" && { color: COLORS.success }]}>
                      +{money(e.currency, e.amount)}
                    </Text>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  hero: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    padding: SPACING.l,
  },
  heroTitle: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.headingBold },
  heroSub: { color: COLORS.textSecondary, fontFamily: FONTS.body, marginTop: 6, lineHeight: 20 },
  codeLabel: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontFamily: FONTS.bodyBold, marginTop: 20 },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    borderStyle: "dashed",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  code: { color: COLORS.goldPremium, fontSize: 26, letterSpacing: 4, fontFamily: FONTS.headingBold },
  primary: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    marginTop: 16,
  },
  primaryText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  statValue: { color: COLORS.textPrimary, fontSize: 22, marginTop: 4, fontFamily: FONTS.headingBold },
  note: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 12, fontFamily: FONTS.body },
  section: {
    color: COLORS.goldMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: FONTS.bodyBold,
    marginTop: 24,
    marginBottom: 10,
  },
  empty: { color: COLORS.textSecondary, fontFamily: FONTS.body, textAlign: "center", padding: SPACING.l },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    marginBottom: 8,
  },
  rowName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bodyBold },
  rowSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  earn: { color: COLORS.goldPremium, fontFamily: FONTS.bodyBold, fontSize: 14 },
});
