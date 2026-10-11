import { useT } from "@/src/store/i18n";
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
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

export default function Profile() {
  const t = useT();
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
        {user?.phone && (
          <View style={styles.phoneRow}>
            <Text style={styles.email}>{user.phone}</Text>
            <View
              style={[
                styles.verifyBadge,
                { backgroundColor: user.is_phone_verified ? COLORS.success : COLORS.error },
              ]}
            >
              <Text style={styles.verifyBadgeText}>
                {user.is_phone_verified ? t("b.pf.verified") : t("b.pf.unverified")}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.trialCard}>
          <Text style={styles.trialLabel}>
            {user?.role === "admin" ? t("b.pf.admin") : t("b.pf.sub")}
          </Text>
          <Text style={styles.trialValue}>
            {user?.role === "admin"
              ? t("b.pf.full")
              : user?.subscription === "trial"
              ? t("b.pf.trial").replace("{n}", String(daysLeft))
              : (user?.subscription || "").toUpperCase()}
          </Text>
        </View>

        {user?.profile && (
          <View style={styles.profileCard}>
            <Text style={styles.sectionLabel}>{t("b.pf.profile")}</Text>
            <Row label={t("b.pf.gender")} value={user.profile.gender} />
            <Row label={t("b.pf.age")} value={t("b.pf.yrs").replace("{n}", String(user.profile.age || "—"))} />
            <Row label={t("b.pf.height")} value={`${user.profile.height_cm} cm`} />
            <Row label={t("b.pf.weight")} value={`${user.profile.weight_kg} kg`} />
            <Row label={t("b.pf.target")} value={`${user.profile.target_weight_kg} kg`} />
            <Row label={t("b.pf.goal")} value={user.profile.goal?.replace("_", " ")} />
            <Row label={t("b.pf.level")} value={user.profile.level} />
            <Row label={t("b.pf.diet")} value={user.profile.diet?.replace("_", " ")} />
          </View>
        )}

        <View style={styles.menu}>
          <MenuItem
            tid="menu-settings"
            icon="settings"
            label={t("b.pf.settings")}
            onPress={() => router.push("/settings" as any)}
          />
          <MenuItem
            tid="menu-subscription"
            icon="diamond"
            label={t("b.pf.subs")}
            onPress={() => router.push("/subscription" as any)}
          />
          <MenuItem
            tid="menu-diary"
            icon="book"
            label={t("b.pf.diary")}
            onPress={() => router.push("/food-diary" as any)}
          />
          <MenuItem
            tid="menu-weight"
            icon="scale"
            label={t("b.pf.wlog")}
            onPress={() => router.push("/weight" as any)}
          />
          <MenuItem
            tid="menu-referrals"
            icon="gift"
            label={t("b.pf.refer")}
            onPress={() => router.push("/referrals" as any)}
          />
          <MenuItem
            tid="menu-recipes"
            icon="restaurant"
            label={t("b.pf.recipes")}
            onPress={() => router.push("/recipes" as any)}
          />
          <MenuItem
            tid="menu-workouts"
            icon="videocam"
            label={t("b.pf.videos")}
            onPress={() => router.push("/workouts" as any)}
          />
          <MenuItem
            tid="menu-form"
            icon="body"
            label={t("b.pf.form")}
            onPress={() => router.push("/form" as any)}
          />
          {user?.role === "admin" && (
            <MenuItem
              tid="menu-admin"
              icon="shield-checkmark"
              label={t("b.pf.adminPanel")}
              onPress={() => router.push("/admin" as any)}
            />
          )}
          <MenuItem
            tid="menu-logout"
            icon="log-out"
            label={t("b.pf.signout")}
            danger
            onPress={() => {
              Alert.alert(t("b.pf.signoutQ"), "", [
                { text: t("b.pf.cancel"), style: "cancel" },
                {
                  text: t("b.pf.signoutBtn"),
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

        <Text style={styles.foot}>{t("b.pf.foot")}</Text>
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
  avatarText: { color: COLORS.onAccent, fontSize: 38, fontWeight: "900", fontFamily: FONTS.headingBold },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 12, fontFamily: FONTS.headingBold },
  email: { color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.body },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  verifyBadge: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  verifyBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700", fontFamily: FONTS.bodyBold },
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
  trialLabel: { color: COLORS.goldMuted, letterSpacing: 1.5, fontSize: 11, fontWeight: "700", fontFamily: FONTS.bodyBold },
  trialValue: { color: COLORS.goldPremium, fontSize: 22, fontWeight: "800", marginTop: 6, fontFamily: FONTS.headingBold },
  profileCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
  },
  sectionLabel: { color: COLORS.goldMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: "700", marginBottom: 10, fontFamily: FONTS.bodyBold },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.body },
  rowValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700", textTransform: "capitalize", fontFamily: FONTS.bodyBold },
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
  menuLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600", flex: 1, fontFamily: FONTS.bodyMedium },
  foot: { color: COLORS.textMuted, fontSize: 11, marginTop: 28, letterSpacing: 1, fontFamily: FONTS.body },
});
