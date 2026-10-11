import React from "react";
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
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAnalyzeForm } from "@/src/hooks/useForm";
import { useT } from "@/src/store/i18n";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

export default function FormCorrector() {
  const router = useRouter();
  const t = useT();
  const analyzeForm = useAnalyzeForm();

  const upload = async () => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      if (!perm.canAskAgain) {
        Alert.alert(
          t("c.form.perm_title"),
          t("c.form.perm_msg")
        );
        return;
      }
      perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") return;
    }

    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos" as any,
      quality: 0.5,
      videoMaxDuration: 30,
    });
    if (r.canceled || !r.assets[0]) return;

    analyzeForm.mutate(
      { videoUri: r.assets[0].uri },
      { onError: (e: any) => Alert.alert(t("c.form.fail"), e.message) }
    );
  };

  const result = analyzeForm.data;

  return (
    <SafeAreaView style={styles.container} testID="form-screen" edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("c.form.title")}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Ionicons name="videocam" size={40} color={COLORS.goldPremium} />
          <Text style={styles.heroTitle}>{t("c.form.hero_title")}</Text>
          <Text style={styles.heroSub}>
            {t("c.form.hero_sub")}
          </Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{t("c.form.best")}</Text>
          <Tip text={t("c.form.tip1")} />
          <Tip text={t("c.form.tip2")} />
          <Tip text={t("c.form.tip3")} />
          <Tip text={t("c.form.tip4")} />
        </View>

        <TouchableOpacity
          testID="form-upload"
          style={[styles.uploadBtn, analyzeForm.isPending && { opacity: 0.7 }]}
          onPress={upload}
          disabled={analyzeForm.isPending}
        >
          {analyzeForm.isPending ? (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator color={COLORS.onAccent} />
              <Text style={[styles.uploadText, { marginTop: 6, fontSize: 11 }]}>
                {t("c.form.analyzing")}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color={COLORS.onAccent} />
              <Text style={styles.uploadText}>{t("c.form.upload")}</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard} testID="form-result">
            <View style={styles.detectedRow}>
              <Text style={styles.detectedLabel}>{t("c.form.detected")}</Text>
              {result.confidence ? (
                <Text style={styles.confTag}>
                  {t("c.form.conf").replace("{v}", String(result.confidence).toUpperCase())}
                </Text>
              ) : null}
            </View>
            <Text style={styles.detectedName}>
              {result.exercise_detected || result.exercise || t("c.form.unknown")}
            </Text>

            <Text style={styles.scoreLabel}>{t("c.form.score")}</Text>
            <Text style={styles.scoreValue}>{result.score}/100</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreFill,
                  {
                    width: `${result.score}%` as any,
                    backgroundColor:
                      result.score >= 75
                        ? COLORS.success
                        : result.score >= 50
                        ? COLORS.goldPremium
                        : COLORS.warning,
                  },
                ]}
              />
            </View>
            <Text style={styles.summary}>{result.summary}</Text>

            <Text style={styles.coachLabel}>{t("c.form.coaching")}</Text>
            {(result.coaching_points || []).map((c, i) => {
              const isFix = c.startsWith("FIX");
              return (
                <View key={i} style={styles.coachRow}>
                  <Ionicons
                    name={isFix ? "warning" : "checkmark-circle"}
                    size={18}
                    color={isFix ? COLORS.warning : COLORS.success}
                  />
                  <Text style={styles.coachText}>{c.replace(/^(FIX|GOOD):\s*/, "")}</Text>
                </View>
              );
            })}

            {result.ideal_form ? (
              <>
                <Text style={styles.coachLabel}>{t("c.form.ideal")}</Text>
                <Text style={styles.idealText}>{result.ideal_form}</Text>
              </>
            ) : null}

            <Text style={styles.framesText}>
              {t("c.form.frames").replace("{n}", String(result.frames_analyzed))}
              {result.duration_s ? ` · ${t("c.form.video_s").replace("{s}", String(result.duration_s))}` : ""}
            </Text>

            <TouchableOpacity style={styles.againBtn} onPress={upload}>
              <Ionicons name="refresh" size={16} color={COLORS.goldPremium} />
              <Text style={styles.againText}>{t("c.form.again")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
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
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: COLORS.goldPremium,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12,
    letterSpacing: 0.3,
    fontFamily: FONTS.headingBold,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 19,
    fontFamily: FONTS.body,
  },
  tipsCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  tipsTitle: {
    color: COLORS.goldMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
    fontFamily: FONTS.bodyBold,
  },
  tipRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.goldPremium },
  tipText: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body },
  uploadBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  uploadText: { color: COLORS.onAccent, fontWeight: "900", letterSpacing: 1.5, fontSize: 14, fontFamily: FONTS.bodyBold },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  detectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detectedLabel: { color: COLORS.goldMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: "800", fontFamily: FONTS.bodyBold },
  confTag: {
    color: COLORS.goldPremium,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    fontFamily: FONTS.bodyBold,
  },
  detectedName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "capitalize",
    marginBottom: 18,
    fontFamily: FONTS.headingBold,
  },
  scoreLabel: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: "700", fontFamily: FONTS.bodyBold },
  scoreValue: { color: COLORS.goldPremium, fontSize: 48, fontWeight: "900", marginTop: 4, fontFamily: FONTS.headingBold },
  scoreBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  scoreFill: { height: 8 },
  summary: { color: COLORS.textPrimary, fontSize: 15, marginTop: 14, lineHeight: 22, fontFamily: FONTS.body },
  coachLabel: {
    color: COLORS.goldMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10,
    fontFamily: FONTS.bodyBold,
  },
  coachRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  coachText: { color: COLORS.textPrimary, flex: 1, fontSize: 14, lineHeight: 20, fontFamily: FONTS.body },
  idealText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: FONTS.body },
  framesText: { color: COLORS.textMuted, fontSize: 11, marginTop: 16, textAlign: "center", fontFamily: FONTS.body },
  againBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  againText: { color: COLORS.goldPremium, fontSize: 13, fontWeight: "700", fontFamily: FONTS.bodyBold },
});
