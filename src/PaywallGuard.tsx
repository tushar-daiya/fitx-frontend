import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSubscriptionStatus } from "@/src/hooks/useSubscription";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export function PaywallGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const { data: status } = useSubscriptionStatus(!!user);

  const isAdmin = user?.role === "admin";
  const onSubscription =
    segments.includes("subscription" as never) || segments.includes("login" as never);

  const blocked =
    !!user && !isAdmin && !!status && status.needs_payment === true && !onSubscription;

  return (
    <>
      {children}
      <Modal visible={blocked} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Trial Expired</Text>
            <Text style={styles.body}>
              Your 7-day free trial has ended. Choose a plan to keep your AI workouts, diet plans,
              meal scanner and coach unlocked.
            </Text>
            <TouchableOpacity
              testID="paywall-cta"
              style={styles.cta}
              onPress={() => router.replace("/subscription" as any)}
            >
              <Text style={styles.ctaText}>CHOOSE A PLAN</Text>
            </TouchableOpacity>
            <Text style={styles.note}>
              ₹1999 for 3 months · UPI or card · Instant unlock
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { color: COLORS.goldPremium, fontSize: 26, fontWeight: "900", letterSpacing: 0.5 },
  body: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 22,
    lineHeight: 22,
    fontSize: 14,
  },
  cta: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  ctaText: { color: "#000", fontWeight: "900", letterSpacing: 1.5, fontSize: 14 },
  note: { color: COLORS.textMuted, fontSize: 12, marginTop: 14, textAlign: "center" },
});
