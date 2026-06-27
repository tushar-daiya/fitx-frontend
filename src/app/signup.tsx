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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || password.length < 6)
      return Alert.alert("Required", "Name, email, password (min 6 chars)");
    setBusy(true);
    try {
      await signup(email.trim(), password, name.trim());
      router.replace("/onboarding");
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
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.brand}>FitX</Text>
          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.sub}>7-day free trial included</Text>

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
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryBtnText}>START FREE TRIAL</Text>
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
  logoImg: { width: 96, height: 96, alignSelf: "center", marginBottom: 8 },
  brand: {
    color: COLORS.goldPremium,
    fontSize: 56,
    fontWeight: "900",
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
  heading: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.l },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
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
  primaryBtnText: { color: "#000", fontWeight: "800", letterSpacing: 1.5 },
});
