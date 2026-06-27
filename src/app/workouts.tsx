import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWorkoutVideos } from "@/src/hooks/useWorkouts";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function Workouts() {
  const router = useRouter();
  const [type, setType] = useState<"home" | "gym">("home");
  const { data: videos = [] } = useWorkoutVideos(type);

  return (
    <SafeAreaView style={styles.container} testID="workouts-screen" edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Videos</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          testID="tab-home"
          style={[styles.tab, type === "home" && styles.tabActive]}
          onPress={() => setType("home")}
        >
          <Ionicons name="home" size={18} color={type === "home" ? "#000" : COLORS.textSecondary} />
          <Text style={[styles.tabText, type === "home" && styles.tabTextActive]}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-gym"
          style={[styles.tab, type === "gym" && styles.tabActive]}
          onPress={() => setType("gym")}
        >
          <Ionicons name="barbell" size={18} color={type === "gym" ? "#000" : COLORS.textSecondary} />
          <Text style={[styles.tabText, type === "gym" && styles.tabTextActive]}>GYM</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {videos.map((v) => (
          <TouchableOpacity
            key={v.id}
            testID={`video-${v.id}`}
            style={styles.card}
            onPress={() => Linking.openURL(v.video_url)}
          >
            <Image source={{ uri: v.thumbnail }} style={styles.thumb} />
            <View style={styles.playBadge}>
              <Ionicons name="play" size={28} color="#000" />
            </View>
            <View style={styles.body}>
              <Text style={styles.vTitle}>{v.title}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaTag}>
                  {v.muscle?.replace("_", " ").toUpperCase()}
                </Text>
                <Text style={styles.metaTag}>{v.level?.toUpperCase()}</Text>
                <Text style={styles.metaTag}>{v.duration_min} MIN</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {videos.length === 0 && (
          <Text style={styles.empty}>No videos yet for this filter.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
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
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginHorizontal: SPACING.l,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.pill,
  },
  tabActive: { backgroundColor: COLORS.goldPremium },
  tabText: { color: COLORS.textSecondary, fontWeight: "800", letterSpacing: 1.5 },
  tabTextActive: { color: "#000" },
  list: { padding: SPACING.l, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    position: "relative",
  },
  thumb: { width: "100%", height: 180, backgroundColor: COLORS.surface2 },
  playBadge: {
    position: "absolute",
    top: 70,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: SPACING.m },
  vTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaTag: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.goldPremium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  empty: { color: COLORS.textMuted, textAlign: "center", padding: 32 },
});
