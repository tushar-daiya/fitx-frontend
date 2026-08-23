import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAdminStats, useAdminUsers, useSendNotification } from "@/src/hooks/useAdmin";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

export default function Admin() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");

  const { data: stats } = useAdminStats();
  const { data: users = [] } = useAdminUsers();
  const sendNotif = useSendNotification();

  if (user?.role !== "admin") {
    router.replace("/(tabs)/home");
    return null;
  }

  const sendNotification = () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      Alert.alert("Title and body are required");
      return;
    }
    sendNotif.mutate(
      { title: notificationTitle.trim(), body: notificationBody.trim() },
      {
        onSuccess: () => {
          Alert.alert("Notification sent");
          setNotificationTitle("");
          setNotificationBody("");
        },
        onError: (e: any) => Alert.alert("Send failed", e.message),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="admin-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Admin</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>PUSH NOTIFICATION</Text>
        <View style={styles.card}>
          <TextInput
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            placeholder="Notification title"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />
          <TextInput
            value={notificationBody}
            onChangeText={setNotificationBody}
            placeholder="Notification body"
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={[styles.input, styles.textArea]}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendNotification} disabled={sendNotif.isPending}>
            {sendNotif.isPending ? <ActivityIndicator color={COLORS.onAccent} /> : <Text style={styles.sendBtnText}>SEND</Text>}
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.grid}>
            <Stat label="USERS" value={stats.users} />
            <Stat label="TRIAL" value={stats.trial_users} />
            <Stat label="MEALS" value={stats.meals_logged} />
            <Stat label="CHATS" value={stats.chat_messages} />
            <Stat label="PLANS" value={stats.plans_generated} />
            <Stat label="RECIPES" value={stats.recipes} />
          </View>
        )}

        <Text style={styles.section}>TOP MEALS SCANNED</Text>
        <View style={styles.card}>
          {(stats?.top_meals || []).length === 0 && (
            <Text style={styles.empty}>No meal data yet</Text>
          )}
          {(stats?.top_meals || []).map((m, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowText}>{m.name}</Text>
              <Text style={styles.rowMeta}>{m.count}x</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>USERS ({users.length})</Text>
        <View style={styles.card}>
          {users.map((u) => (
            <View key={u.id} style={styles.row}>
              <View>
                <Text style={styles.rowText}>{u.name}</Text>
                <Text style={styles.rowSub}>{u.email}</Text>
              </View>
              <Text style={styles.rowMeta}>{u.subscription}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          testID="add-recipe-btn"
          style={styles.addBtn}
          onPress={() => router.push("/admin-recipe" as any)}
        >
          <Ionicons name="add-circle" size={22} color={COLORS.onAccent} />
          <Text style={styles.addBtnText}>ADD RECIPE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16, marginTop: 16 },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  statValue: { color: COLORS.goldPremium, fontSize: 24, fontWeight: "900", fontFamily: FONTS.headingBold },
  statLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: "700", marginTop: 4, fontFamily: FONTS.bodyBold },
  section: {
    color: COLORS.goldMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: FONTS.bodyBold,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600", fontFamily: FONTS.bodyMedium },
  rowSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontFamily: FONTS.body },
  rowMeta: { color: COLORS.goldPremium, fontSize: 12, fontWeight: "700", textTransform: "uppercase", fontFamily: FONTS.bodyBold },
  empty: { color: COLORS.textMuted, textAlign: "center", padding: 16, fontFamily: FONTS.body },
  input: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: FONTS.body,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  sendBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: { color: COLORS.onAccent, fontWeight: "900", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  addBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  addBtnText: { color: COLORS.onAccent, fontWeight: "900", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
});
