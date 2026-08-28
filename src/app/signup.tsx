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

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !phone || password.length < 6)
      return Alert.alert("Required", "Name, email, phone, password (min 6 chars)");
    setBusy(true);
    try {
      const { phone: verifiedPhone } = await signup(
        email.trim(),
        phone.trim(),
        password,
        name.trim(),
      );
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

  return (
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
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING.s,
  },
  primaryBtnText: { color: COLORS.onAccent, fontFamily: FONTS.bodyBold, letterSpacing: 1.5 },
});
