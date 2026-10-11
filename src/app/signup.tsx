import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";
import { AuthVideoBackground } from "@/src/AuthVideoBackground";
import { clearPendingReferral, getPendingReferral, sanitizeCode, REFERRAL_CODE_LENGTH } from "@/src/lib/referral";
import { useReferralCheck } from "@/src/hooks/useReferralCheck";

export default function Signup() {
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const { signup } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const referral = useReferralCheck();

  // Pre-fill from a deep link or the install source (Play referrer / clipboard).
  useEffect(() => {
    referral.autoFill(sanitizeCode(ref));
    getPendingReferral().then(referral.autoFill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    setSubmitted(true);
    if (!name || !email || !phone || password.length < 6)
      return Alert.alert("Required", "Name, email, phone, password (min 6 chars)");
    if (referral.blocker) return;
    setBusy(true);
    try {
      const { phone: verifiedPhone } = await signup(
        email.trim(),
        phone.trim(),
        password,
        name.trim(),
        { referralCode: referral.code, marketingOptIn },
      );
      clearPendingReferral();
      router.replace({
        pathname: "/verify-otp",
        params: { phone: verifiedPhone, purpose: "signup" },
      });
    } catch (e: any) {
      Alert.alert("Signup failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const showChip =
    referral.code.length > 0 &&
    (referral.status === "valid" || (referral.status === "checking" && referral.autoFilled));
  const showInput = !showChip && (referral.open || referral.code.length > 0);
  const referralError =
    referral.status === "invalid" ||
    (submitted && referral.code.length > 0 && referral.code.length < REFERRAL_CODE_LENGTH)
      ? referral.blocker
      : null;

  return (
    <AuthVideoBackground>
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={112} style={styles.logoImg} />
          <Text style={styles.brand}>FitX</Text>
          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.sub}>7-day free trial available after a quick setup</Text>

            <TextInput
              testID="signup-name"
              placeholder="Full name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              testID="signup-email"
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                testID="signup-phone"
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
                style={styles.phoneInput}
              />
            </View>
            <TextInput
              testID="signup-password"
              placeholder="Password (min 6 chars)"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            {showChip ? (
              <View style={styles.chip} testID="signup-referral-chip">
                <Ionicons name="gift" size={18} color={COLORS.goldPremium} />
                <Text style={styles.chipText}>
                  {referral.status === "valid" ? `Invited by ${referral.referrer}` : "Checking your invite…"}
                </Text>
                {referral.status === "valid" ? (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                ) : (
                  <ActivityIndicator size="small" color={COLORS.goldPremium} />
                )}
                <TouchableOpacity testID="signup-referral-remove" onPress={referral.clear} hitSlop={10} style={{ marginLeft: "auto" }}>
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : showInput ? (
              <View style={{ marginBottom: SPACING.m }}>
                <View style={[styles.referralRow, referralError ? { borderColor: COLORS.error } : null]}>
                  <TextInput
                    testID="signup-referral"
                    placeholder="Referral code"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus={referral.open && referral.code.length === 0}
                    maxLength={REFERRAL_CODE_LENGTH}
                    value={referral.code}
                    onChangeText={referral.type}
                    style={styles.referralInput}
                  />
                  {referral.status === "checking" && <ActivityIndicator size="small" color={COLORS.goldPremium} />}
                  <TouchableOpacity onPress={referral.clear} hitSlop={10}>
                    <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                {referralError ? <Text style={styles.errText}>{referralError}</Text> : null}
              </View>
            ) : (
              <TouchableOpacity testID="signup-referral-toggle" onPress={() => referral.setOpen(true)} style={styles.referralLink}>
                <Ionicons name="gift-outline" size={16} color={COLORS.goldPremium} />
                <Text style={styles.referralLinkText}>Have a referral code?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              testID="signup-submit"
              style={styles.primaryBtn}
              onPress={onSubmit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.onAccent} />
              ) : (
                <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="signup-marketing"
              style={styles.consentRow}
              onPress={() => setMarketingOptIn((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={marketingOptIn ? "checkbox" : "square-outline"}
                size={20}
                color={marketingOptIn ? COLORS.goldPremium : COLORS.textMuted}
              />
              <Text style={styles.consentText}>Send me offers and updates on WhatsApp</Text>
            </TouchableOpacity>
            <Text style={styles.legal}>
              By creating an account you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => router.push("/terms" as any)}>Terms</Text>
              {" "}and{" "}
              <Text style={styles.legalLink} onPress={() => router.push("/privacy" as any)}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity
              testID="go-login"
              onPress={() => router.push("/login")}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Have an account? <Text style={{ color: COLORS.goldPremium }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AuthVideoBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: { flexGrow: 1, padding: SPACING.l, justifyContent: "center" },
  logoImg: { alignSelf: "center", marginBottom: 8 },
  brand: {
    color: COLORS.goldPremium,
    fontFamily: FONTS.headingBold,
    fontSize: 60,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
  },
  heading: { color: COLORS.textPrimary, fontFamily: FONTS.headingSemiBold, fontSize: 28 },
  sub: { color: COLORS.textSecondary, fontFamily: FONTS.body, marginTop: 4, marginBottom: SPACING.l },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.m,
  },
  phoneRow: { flexDirection: "row", marginBottom: SPACING.m },
  phonePrefix: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    justifyContent: "center",
    marginRight: 8,
  },
  phonePrefixText: { color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, fontSize: 16 },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.m },
  consentText: { flex: 1, color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 13 },
  legal: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, marginTop: 8 },
  legalLink: { color: COLORS.goldPremium },
  referralLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginBottom: SPACING.m },
  referralLinkText: { color: COLORS.goldPremium, fontFamily: FONTS.bodyBold, fontSize: 13 },
  referralRow: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16,
  },
  referralInput: { flex: 1, paddingVertical: 14, color: COLORS.textPrimary, fontFamily: FONTS.bodyBold, fontSize: 16, letterSpacing: 3 },
  errText: { color: COLORS.error, fontSize: 12, marginTop: 6, fontFamily: FONTS.bodyMedium },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.goldTint,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderAccent,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: SPACING.m,
  },
  chipText: { color: COLORS.goldPremium, fontFamily: FONTS.bodyBold, fontSize: 14 },
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING.s,
  },
  primaryBtnText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
});

