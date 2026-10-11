import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";
import { AuthVideoBackground } from "@/src/AuthVideoBackground";
import { useT } from "@/src/store/i18n";

export default function ForgotPassword() {
  const router = useRouter();
  const t = useT();
  const { requestPasswordReset } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!phone) return Alert.alert(t("a.required"), t("a.enterPhone"));
    setBusy(true);
    try {
      const fullPhone = `+91${phone.trim()}`;
      await requestPasswordReset(fullPhone);
      router.push({
        pathname: "/verify-otp",
        params: { phone: fullPhone, purpose: "reset" },
      });
    } catch (e: any) {
      Alert.alert(t("a.fp.failed"), e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthVideoBackground>
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={96} style={styles.logoImg} />
          <View style={styles.card}>
            <Text style={styles.heading}>{t("a.fp.heading")}</Text>
            <Text style={styles.sub}>{t("a.fp.sub")}</Text>

            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                testID="forgot-password-phone"
                placeholder={t("a.phoneHint")}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
                style={styles.phoneInput}
              />
            </View>

            <TouchableOpacity testID="forgot-password-submit" style={styles.primaryBtn} onPress={onSubmit} disabled={busy}>
              {busy ? <ActivityIndicator color={COLORS.onAccent} /> : <Text style={styles.primaryBtnText}>{t("a.sendCode")}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              testID="go-login-from-forgot"
              onPress={() => router.back()}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              <Text style={styles.linkText}>{t("a.fp.back")}</Text>
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
