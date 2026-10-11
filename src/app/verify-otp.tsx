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
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";
import { AuthVideoBackground } from "@/src/AuthVideoBackground";
import { useT } from "@/src/store/i18n";

const RESEND_COOLDOWN_S = 30;

type Purpose = "signup" | "phone_verify" | "reset" | "phone_change";

export default function VerifyOtp() {
  const router = useRouter();
  const t = useT();
  const params = useLocalSearchParams<{ phone: string; purpose: Purpose }>();
  const phone = params.phone ?? "";
  const purpose = (params.purpose as Purpose) ?? "signup";
  const { verifySignupOtp, verifyPhoneOtp, resendOtp, changePhoneVerify } = useAuthStore();

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onVerify = async () => {
    if (otp.length < 4) return Alert.alert(t("a.required"), t("a.otp.enterCode"));
    setBusy(true);
    try {
      if (purpose === "signup") {
        await verifySignupOtp(phone, otp);
        router.replace("/onboarding");
      } else if (purpose === "phone_verify") {
        await verifyPhoneOtp(phone, otp);
        router.replace("/");
      } else if (purpose === "reset") {
        router.replace({ pathname: "/reset-password", params: { phone, otp } });
      } else {
        await changePhoneVerify(phone, otp);
        Alert.alert(t("a.otp.phoneUpdated"), "", [{ text: t("a.ok"), onPress: () => router.back() }]);
      }
    } catch (e: any) {
      Alert.alert(t("a.otp.failed"), e.message);
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(phone);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (e: any) {
      Alert.alert(t("a.otp.resendFail"), e.message);
    }
  };

  return (
    <AuthVideoBackground>
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={96} style={styles.logoImg} />
          <View style={styles.card}>
            <Text style={styles.heading}>{t("a.otp.heading")}</Text>
            <Text style={styles.sub}>{t("a.otp.sub").replace("{phone}", phone)}</Text>

            <TextInput
              testID="otp-code"
              placeholder={t("a.otp.ph")}
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
              maxLength={8}
            />

            <TouchableOpacity testID="otp-submit" style={styles.primaryBtn} onPress={onVerify} disabled={busy}>
              {busy ? <ActivityIndicator color={COLORS.onAccent} /> : <Text style={styles.primaryBtnText}>{t("a.otp.verify")}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              testID="otp-resend"
              onPress={onResend}
              disabled={cooldown > 0}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              <Text style={[styles.linkText, cooldown > 0 && { opacity: 0.5 }]}>
                {cooldown > 0 ? t("a.otp.resendIn").replace("{s}", String(cooldown)) : t("a.otp.resend")}
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
    letterSpacing: 4,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING.s,
  },
  primaryBtnText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
  linkText: { color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 14 },
});
