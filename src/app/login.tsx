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

export default function Login() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!email || !password) return Alert.alert("Required", "Enter email and password");
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={112} style={styles.logoImg} />
          <Text style={styles.brand}>FitX</Text>
          <Text style={styles.tag}>Elevate Your Fitness Journey</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to continue your journey</Text>

            <TextInput
              testID="login-email"
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              testID="login-password"
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity
              testID="login-submit"
              style={styles.primaryBtn}
              onPress={onLogin}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.onAccent} />
              ) : (
                <Text style={styles.primaryBtnText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="go-signup"
              onPress={() => router.push("/signup")}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              <Text style={styles.linkText}>
                New here? <Text style={{ color: COLORS.goldPremium }}>Create account</Text>
              </Text>
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
  brand: {
    color: COLORS.goldPremium,
    fontFamily: FONTS.headingBold,
    fontSize: 60,
    letterSpacing: 3,
    textAlign: "center",
  },
  tag: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 13,
    letterSpacing: 2,
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
