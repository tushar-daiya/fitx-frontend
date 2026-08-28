import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { COLORS, FONTS } from "@/src/theme";
import { Logo } from "@/src/Logo";

export default function Index() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const delay = setTimeout(() => {
      if (!user) router.replace("/login");
      else if (!user.is_phone_verified) router.replace("/verify-phone");
      else if (!user.onboarded) router.replace("/onboarding");
      else router.replace("/(tabs)/home");
    }, 800);
    return () => clearTimeout(delay);
  }, [loading, user]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="splash-screen">
      <Logo size={160} style={styles.logo} />
      <Text style={styles.brand}>FitX</Text>
      <Text style={styles.tag}>Elevate Your Fitness Journey</Text>

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 200} />
        ))}
      </View>
    </Animated.View>
  );
}

function PulseDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    marginBottom: 4,
  },
  brand: {
    color: COLORS.goldPremium,
    fontFamily: FONTS.headingBold,
    fontSize: 52,
    letterSpacing: 6,
    marginTop: 16,
    textAlign: "center",
  },
  tag: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 8,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.goldPremium,
  },
});
