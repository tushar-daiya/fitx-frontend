import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function Profile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const trialEnd = user?.trial_ends ? new Date(user.trial_ends) : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <SafeAreaView style={styles.container} testID="profile-screen" edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "F"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.trialCard}>
          <Text style={styles.trialLabel}>
            {user?.role === "admin" ? "ADMIN ACCESS" : "SUBSCRIPTION"}
          </Text>
          <Text style={styles.trialValue}>
            {user?.role === "admin"
              ? "Full Access"
              : user?.subscription === "trial"
              ? `Free Trial · ${daysLeft}d left`
              : (user?.subscription || "").toUpperCase()}
          </Text>
        </View>

        {user?.profile && (
          <View style={styles.profileCard}>
            <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
            <Row label="Gender" value={user.profile.gender} />
            <Row label="Age" value={`${user.profile.age || "—"} yrs`} />
            <Row label="Height" value={`${user.profile.height_cm} cm`} />
            <Row label="Weight" value={`${user.profile.weight_kg} kg`} />
            <Row label="Target" value={`${user.profile.target_weight_kg} kg`} />
            <Row label="Goal" value={user.profile.goal?.replace("_", " ")} />
            <Row label="Level" value={user.profile.level} />
            <Row label="Diet" value={user.profile.diet?.replace("_", " ")} />
          </View>
        )}

        <View style={styles.menu}>
          <MenuItem
            tid="menu-settings"
            icon="settings"
            label="Settings & Preferences"
            onPress={() => router.push("/settings" as any)}
          />
          <MenuItem
            tid="menu-subscription"
            icon="diamond"
            label="Subscription Plans"
            onPress={() => router.push("/subscription" as any)}
          />
          <MenuItem
            tid="menu-recipes"
            icon="restaurant"
            label="Recipe Library"
            onPress={() => router.push("/recipes" as any)}
          />
          <MenuItem
            tid="menu-workouts"
            icon="videocam"
            label="Workout Videos"
            onPress={() => router.push("/workouts" as any)}
          />
          <MenuItem
            tid="menu-form"
            icon="body"
            label="Form Corrector (AI)"
            onPress={() => router.push("/form" as any)}
          />
          {user?.role === "admin" && (
            <MenuItem
              tid="menu-admin"
              icon="shield-checkmark"
              label="Admin Panel"
              onPress={() => router.push("/admin" as any)}
            />
          )}
          <MenuItem
            tid="menu-logout"
            icon="log-out"
            label="Sign Out"
            danger
            onPress={() => {
              Alert.alert("Sign out?", "", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                    router.replace("/login");
                  },
                },
              ]);
            }}
          />
        </View>

        <Text style={styles.foot}>FitX · Elevate Your Fitness Journey</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function MenuItem({
  tid,
  icon,
  label,
  danger,
  onPress,
}: {
  tid: string;
  icon: any;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity testID={tid} style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={danger ? COLORS.error : COLORS.goldPremium} />
      <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.l, alignItems: "center", paddingBottom: 60 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  avatarText: { color: "#000", fontSize: 38, fontWeight: "900" },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12 },
  email: { color: COLORS.textSecondary, marginTop: 2 },
  trialCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    alignItems: "center",
  },
  trialLabel: { color: COLORS.goldMuted, letterSpacing: 1.5, fontSize: 11, fontWeight: "700" },
  trialValue: { color: COLORS.goldPremium, fontSize: 22, fontWeight: "800", marginTop: 6 },
  profileCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
  },
  sectionLabel: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: COLORS.textSecondary, fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  menu: { width: "100%", marginTop: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuLabel: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  foot: { color: COLORS.textMuted, fontSize: 11, marginTop: 28, letterSpacing: 1 },
});
