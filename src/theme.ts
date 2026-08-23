export const FONTS = {
  headingBold: "BarlowCondensed_700Bold",
  headingSemiBold: "BarlowCondensed_600SemiBold",
  headingMedium: "BarlowCondensed_500Medium",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
};

export const COLORS = {
  bg: "#0D0D0D",
  surface: "#121212",
  surfaceElevated: "#1A1A1A",
  surface2: "#242424",
  gold: "#D4AF37",
  goldPremium: "#E5C158",
  goldMuted: "#B8941F",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#6B7280",
  border: "#FFFFFF14",
  borderAccent: "rgba(212, 175, 55, 0.35)",
  onAccent: "#0D0D0D",
  goldTint: "rgba(212, 175, 55, 0.10)",
  errorTint: "rgba(239, 68, 68, 0.10)",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
};

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };
export const SPACING = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 };

export const FONT = {
  h1: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.5, fontFamily: FONTS.headingBold },
  h2: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.3, fontFamily: FONTS.headingBold },
  h3: { fontSize: 21, fontWeight: "700" as const, fontFamily: FONTS.headingSemiBold },
  body: { fontSize: 16, fontWeight: "500" as const, fontFamily: FONTS.body },
  small: { fontSize: 13, fontWeight: "500" as const, fontFamily: FONTS.body },
  caption: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
};
