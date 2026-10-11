import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSubscriptionPlans, useSubscriptionStatus } from "@/src/hooks/useSubscription";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";

export function PaywallGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const { data: status } = useSubscriptionStatus(!!user);
  const { data: plans } = useSubscriptionPlans();

  // Note: the `trial_ended` analytics event is emitted server-side (see the
  // backend trial sweep) so it fires even for users who never reopen the app.

  const isAdmin = user?.role === "admin";
  // Screens where the paywall must not appear: plan/checkout, auth, and the
  // post-onboarding trial screen (where the user opts into their free trial).
  const onSubscription =
    segments.includes("subscription" as never) ||
    segments.includes("login" as never) ||
    segments.includes("start-trial" as never);

  // Don't gate users who are still in the signup / onboarding flow — they
  // haven't reached the point of choosing a plan yet. The paywall only applies
  // once onboarding is complete and they've entered the app.
  const blocked =
    !!user &&
    !!user.onboarded &&
    !isAdmin &&
    !!status &&
    status.needs_payment === true &&
    !onSubscription;

  // The user reaches this paywall either because their trial/plan expired, or
  // because they never opted into a plan after onboarding. Adapt the copy so we
  // don't tell someone their trial ended when they never started one.
  const hadTrial = !!status?.history.some((h) => h.plan === "trial");
  const trialPlan = plans?.find((p) => p.is_trial || p.id === "trial");
  const trialDays = trialPlan?.days ?? 7;
  // Highlight the popular paid plan (else 3m, else cheapest paid) in the note.
  const paid = (plans ?? []).filter((p) => !(p.is_trial || p.id === "trial"));
  const featured =
    paid.find((p) => p.popular) ?? paid.find((p) => p.id === "3m") ?? paid[0];
  const months = featured ? Math.round(featured.days / 30) : 0;
  const featuredNote = featured
    ? `₹${featured.price} for ${months === 1 ? "1 month" : `${months} months`} · UPI or card · Instant unlock`
    : "UPI or card · Instant unlock";
  const hadAnyPlan = hadTrial || (status?.history.length ?? 0) > 0;

  return (
    <>
      {children}
      <Modal visible={blocked} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Logo size={104} style={styles.logo} />
            <Text style={styles.title}>
              {hadTrial ? "Trial Expired" : hadAnyPlan ? "Plan Expired" : "Unlock FitX"}
            </Text>
            <Text style={styles.body}>
              {hadTrial
                ? `Your ${trialDays}-day free trial has ended. Choose a plan to keep your AI workouts, diet plans, meal scanner and coach unlocked.`
                : hadAnyPlan
                ? "Your plan has ended. Choose a plan to keep your AI workouts, diet plans, meal scanner and coach unlocked."
                : trialPlan
                ? `Start your ${trialDays}-day free trial or pick a plan to unlock your AI workouts, diet plans, meal scanner and coach.`
                : "Pick a plan to unlock your AI workouts, diet plans, meal scanner and coach."}
            </Text>
            <TouchableOpacity
              testID="paywall-cta"
              style={styles.cta}
              onPress={() => router.replace("/subscription" as any)}
            >
              <Text style={styles.ctaText}>
                {hadAnyPlan ? "CHOOSE A PLAN" : "GET STARTED"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.note}>
              {hadAnyPlan
                ? featuredNote
                : trialPlan
                ? `${trialDays}-day free trial · No charge · Cancel anytime`
                : featuredNote}
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
  logo: { marginBottom: 16 },
  title: { color: COLORS.goldPremium, fontFamily: FONTS.headingBold, fontSize: 30, letterSpacing: 0.5 },
  body: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
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
  ctaText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5, fontSize: 14 },
  note: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, marginTop: 14, textAlign: "center" },
});
