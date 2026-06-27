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
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function FormCorrector() {
  const router = useRouter();
  const analyzeForm = useAnalyzeForm();

  const upload = async () => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      if (!perm.canAskAgain) {
        Alert.alert(
          "Permission required",
          "Please enable Photos access from Settings to upload a workout video."
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
      { onError: (e: any) => Alert.alert("Analysis failed", e.message) }
    );
  };

  const result = analyzeForm.data;

  return (
    <SafeAreaView style={styles.container} testID="form-screen" edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Form Corrector</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Ionicons name="videocam" size={40} color={COLORS.goldPremium} />
          <Text style={styles.heroTitle}>AI Form Analysis</Text>
          <Text style={styles.heroSub}>
            Upload any workout video — squat, push-up, deadlift, plank, lunge, curl, press, burpee,
            jumping jack and more. Our AI detects the movement and gives you specific posture
            corrections and coaching tips.
          </Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📹 BEST RESULTS</Text>
          <Tip text="Record from the side (90° angle) for best pose detection" />
          <Tip text="Full body must be visible in the frame" />
          <Tip text="Good lighting · plain background helps" />
          <Tip text="Keep it under 30 seconds" />
        </View>

        <TouchableOpacity
          testID="form-upload"
          style={[styles.uploadBtn, analyzeForm.isPending && { opacity: 0.7 }]}
          onPress={upload}
          disabled={analyzeForm.isPending}
        >
          {analyzeForm.isPending ? (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator color="#000" />
              <Text style={[styles.uploadText, { marginTop: 6, fontSize: 11 }]}>
                Analyzing your form with AI...
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color="#000" />
              <Text style={styles.uploadText}>UPLOAD WORKOUT VIDEO</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard} testID="form-result">
            <View style={styles.detectedRow}>
              <Text style={styles.detectedLabel}>EXERCISE DETECTED</Text>
              {result.confidence ? (
                <Text style={styles.confTag}>
                  {String(result.confidence).toUpperCase()} CONFIDENCE
                </Text>
              ) : null}
            </View>
            <Text style={styles.detectedName}>
              {result.exercise_detected || result.exercise || "Unknown movement"}
            </Text>

            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
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

            <Text style={styles.coachLabel}>COACHING NOTES</Text>
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
                <Text style={styles.coachLabel}>IDEAL FORM</Text>
                <Text style={styles.idealText}>{result.ideal_form}</Text>
              </>
            ) : null}

            <Text style={styles.framesText}>
              {result.frames_analyzed} frames analyzed
              {result.duration_s ? ` · ${result.duration_s}s video` : ""}
            </Text>

            <TouchableOpacity style={styles.againBtn} onPress={upload}>
              <Ionicons name="refresh" size={16} color={COLORS.goldPremium} />
              <Text style={styles.againText}>Analyze another video</Text>
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
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
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
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 19,
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
  },
  tipRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.goldPremium },
  tipText: { color: COLORS.textSecondary, fontSize: 13 },
  uploadBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  uploadText: { color: "#000", fontWeight: "900", letterSpacing: 1.5, fontSize: 14 },
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
  detectedLabel: { color: COLORS.goldMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: "800" },
  confTag: {
    color: COLORS.goldPremium,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  detectedName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textTransform: "capitalize",
    marginBottom: 18,
  },
  scoreLabel: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: "700" },
  scoreValue: { color: COLORS.goldPremium, fontSize: 48, fontWeight: "900", marginTop: 4 },
  scoreBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  scoreFill: { height: 8 },
  summary: { color: "#fff", fontSize: 15, marginTop: 14, lineHeight: 22 },
  coachLabel: {
    color: COLORS.goldMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10,
  },
  coachRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  coachText: { color: "#fff", flex: 1, fontSize: 14, lineHeight: 20 },
  idealText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  framesText: { color: COLORS.textMuted, fontSize: 11, marginTop: 16, textAlign: "center" },
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
  againText: { color: COLORS.goldPremium, fontSize: 13, fontWeight: "700" },
});
