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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; otp: string }>();
  const { resetPassword } = useAuthStore();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (password.length < 6) return Alert.alert("Required", "Password must be at least 6 characters");
    setBusy(true);
    try {
      await resetPassword(params.phone, params.otp, password);
      Alert.alert("Password updated", "Sign in with your new password", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Reset failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={96} style={styles.logoImg} />
          <View style={styles.card}>
            <Text style={styles.heading}>Set a new password</Text>
            <Text style={styles.sub}>Choose a new password for your account</Text>

            <TextInput
              testID="reset-password-input"
              placeholder="New password (min 6 chars)"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity testID="reset-password-submit" style={styles.primaryBtn} onPress={onSubmit} disabled={busy}>
              {busy ? <ActivityIndicator color={COLORS.onAccent} /> : <Text style={styles.primaryBtnText}>UPDATE PASSWORD</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING.s,
  },
  primaryBtnText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
});
