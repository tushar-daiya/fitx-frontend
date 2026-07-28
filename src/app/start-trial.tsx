import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubscribe } from "@/src/hooks/useSubscription";
import { useAuthStore } from "@/src/store/auth";
import { track } from "@/src/lib/analytics";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

const PERKS = [
  "AI-personalised workout & diet plans",
  "Unlimited meal photo scans",
  "Your 24/7 AI fitness coach",
  "Full recipe library",
];

export default function StartTrial() {
  const router = useRouter();
  const { user, refresh } = useAuthStore();
  const subscribe = useSubscribe();

  const startTrial = () => {
    track("begin_checkout", { plan: "trial", is_trial: true });
    subscribe.mutate("trial", {
      onSuccess: async (res) => {
        track("trial_started", { plan: "trial", value: 0, trial_ends: res?.ends });
        await refresh();
        router.replace("/(tabs)/home");
      },
      onError: (e: any) => {
        track("trial_failed", { plan: "trial", reason: e?.message });
        Alert.alert("Error", e.message);
      },
    });
  };

  const firstName = user?.name?.split(" ")[0];

  return (
    <SafeAreaView style={styles.container} testID="start-trial-screen">
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
        </Text>
        <Text style={styles.sub}>
          Start your 7-day free trial to unlock everything. No payment required.
        </Text>

        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.goldPremium} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="start-trial-btn"
          style={styles.cta}
          onPress={startTrial}
          disabled={subscribe.isPending}
        >
          {subscribe.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.ctaText}>START 7-DAY FREE TRIAL</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.note}>Free for 7 days · Cancel anytime</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "space-between" },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 96, height: 96, marginBottom: 20 },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 32,
    lineHeight: 22,
  },
  perks: { alignSelf: "stretch", gap: 14 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkText: { color: "#fff", fontSize: 15, flex: 1 },
  footer: { padding: SPACING.l },
  cta: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: { color: "#000", fontWeight: "900", letterSpacing: 1.5, fontSize: 15 },
  note: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginTop: 14 },
});
