import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useT } from "@/src/store/i18n";
import { COLORS, SPACING, FONTS } from "@/src/theme";

export default function Terms() {
  const router = useRouter();
  const t = useT();
  return (
    <SafeAreaView style={styles.container} testID="terms-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("c.set.terms")}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Last updated: 20 May 2026</Text>

        <Section title="1. Acceptance">
          By creating an account or using FitX, you agree to these Terms of Service. If you do not agree, do not use the app.
        </Section>

        <Section title="2. Health disclaimer">
          FitX provides AI-generated fitness suggestions for educational purposes only. It is NOT medical advice. Always consult a qualified physician before starting any exercise or diet program, especially if you have pre-existing conditions, are pregnant, or are under 18. You use the app at your own risk.
        </Section>

        <Section title="3. Subscriptions">
          {"• 7-day free trial on signup\n" +
           "• Plans: 3M (₹1999), 6M (₹2999), 12M (₹4999), or USD equivalents\n" +
           "• Payments are processed securely by Razorpay (UPI, cards, wallets & netbanking). Your subscription unlocks only after the payment is verified\n" +
           "• Refunds: no refunds for partial periods; full refund within 24 hrs of payment on written request"}
        </Section>

        <Section title="4. Acceptable use">
          {"• No reverse-engineering or abuse of the AI APIs\n" +
           "• No sharing accounts or credentials\n" +
           "• No automated scraping\n" +
           "• No uploading illegal, defamatory, or sexual content\n" +
           "• No spamming the AI coach with off-topic messages (coach is fitness-only)"}
        </Section>

        <Section title="5. User content">
          You retain ownership of meal photos, workout videos, and logs you create. You grant FitX a limited license to process this content via our AI providers for the sole purpose of providing the service.
        </Section>

        <Section title="6. AI accuracy">
          AI-generated plans, calorie estimates, and form analysis are approximate. We make no guarantee of accuracy, fitness outcomes, weight loss, or muscle gain results.
        </Section>

        <Section title="7. Termination">
          We may suspend or terminate accounts that violate these terms. You may delete your account anytime via Settings.
        </Section>

        <Section title="8. Limitation of liability">
          To the maximum extent permitted by law, FitX is not liable for any injury, loss, or damages arising from use of the app. Total liability is limited to the amount you paid in the last 12 months.
        </Section>

        <Section title="9. Governing law">
          These terms are governed by the laws of India. Disputes will be resolved in courts of Bengaluru, Karnataka.
        </Section>

        <Section title="10. Contact">
          {"Legal queries:\nlegal@fitxglobal.com"}
        </Section>

        <Text style={styles.footer}>© 2026 FitX Global. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
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
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", fontFamily: FONTS.headingBold, letterSpacing: 0.5 },
  scroll: { padding: SPACING.l, paddingBottom: 60 },
  updated: { color: COLORS.textMuted, fontSize: 12, marginBottom: 24, letterSpacing: 0.5, fontFamily: FONTS.body },
  section: { marginBottom: 24 },
  heading: { color: COLORS.goldPremium, fontSize: 16, fontWeight: "800", fontFamily: FONTS.headingSemiBold, marginBottom: 8, letterSpacing: 0.3 },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: FONTS.body },
  footer: { color: COLORS.textMuted, fontSize: 11, textAlign: "center", marginTop: 20, letterSpacing: 0.5, fontFamily: FONTS.body },
});
