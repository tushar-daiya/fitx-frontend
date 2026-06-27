export const COLORS = {
  bg: "#000000",
  surface: "#0A0A0A",
  surfaceElevated: "#121212",
  surface2: "#1A1A1A",
  gold: "#FFD700",
  goldPremium: "#D4AF37",
  goldMuted: "#C8A24D",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#6B7280",
  border: "#1F1F1F",
  borderAccent: "rgba(212, 175, 55, 0.35)",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
};

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };
export const SPACING = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 };

export const FONT = {
  h1: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "500" as const },
  small: { fontSize: 13, fontWeight: "500" as const },
  caption: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.5 },
};
