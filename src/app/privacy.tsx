import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

export default function Privacy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} testID="privacy-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Last updated: 20 May 2026</Text>

        <Section title="1. Overview">
          FitX ("we", "our", "app") is committed to protecting your privacy. This policy explains what data we collect, why we collect it, and your rights over your data.
        </Section>

        <Section title="2. Data we collect">
          {"• Account info: name, email, password (hashed)\n" +
           "• Profile data: age, gender, height, weight, fitness goal, diet, activity level\n" +
           "• Health metrics: meal logs, calorie intake, steps, water, workouts (all user-entered)\n" +
           "• Photos: meal images you scan (sent to AI for nutrition analysis, not stored long-term)\n" +
           "• Workout videos: optional uploads for AI form analysis (processed then deleted)\n" +
           "• Payment data: Razorpay order/payment reference, plan, amount (card & UPI details are handled by Razorpay, never stored by us)"}
        </Section>

        <Section title="3. How we use your data">
          {"• Generate personalized AI workout & diet plans\n" +
           "• Provide calorie/macro tracking and progress visualisation\n" +
           "• Power the AI fitness coach chatbot\n" +
           "• Process subscription payments\n" +
           "• Improve app functionality and detect abuse"}
        </Section>

        <Section title="4. Third-party services">
          {"• OpenAI (meal scanning, plan generation): meal photos sent for analysis\n" +
           "• Anthropic Claude (AI coach): chat messages processed for replies\n" +
           "• Razorpay (payment processing — UPI, cards, wallets, netbanking)\n" +
           "• MongoDB (encrypted data storage)\n\n" +
           "We do not sell your data to advertisers."}
        </Section>

        <Section title="5. Data retention">
          We retain your profile and logs for as long as your account is active. You can delete your account anytime from Settings; we then permanently delete your data within 30 days.
        </Section>

        <Section title="6. Your rights">
          {"• Access, correct, or delete your data\n" +
           "• Export your fitness data (request via email)\n" +
           "• Withdraw consent for AI processing\n" +
           "• Lodge a complaint with your local data protection authority"}
        </Section>

        <Section title="7. Security">
          Passwords are hashed with bcrypt. All API calls use HTTPS/TLS 1.2+. Authentication uses signed JWTs with limited lifetimes.
        </Section>

        <Section title="8. Children">
          FitX is not intended for users under 16. We do not knowingly collect data from minors.
        </Section>

        <Section title="9. Changes to this policy">
          We may update this policy. Material changes will be notified via in-app banner. Continued use = acceptance.
        </Section>

        <Section title="10. Contact">
          {"Questions or data requests:\nsupport@fitxglobal.com"}
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
