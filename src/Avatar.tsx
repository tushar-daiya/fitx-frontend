import React from "react";
import Svg, { Path, Ellipse } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "./theme";

export function Avatar({
  gender = "male",
  leanness = 0.5,
  muscle = 0.5,
  size = 220,
}: {
  gender?: "male" | "female" | "other";
  leanness?: number;
  muscle?: number;
  size?: number;
}) {
  const waist = 32 - leanness * 12;
  const shoulder = 50 + muscle * 18;
  const chest = 44 + muscle * 14;
  const thigh = 16 + muscle * 6;
  const headR = 14;
  const cx = 100;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size * 1.3} viewBox="0 0 200 260">
        <Ellipse
          cx={cx}
          cy={28}
          rx={headR}
          ry={headR + 2}
          fill={COLORS.surface2}
          stroke={COLORS.goldPremium}
          strokeWidth={1.5}
        />
        <Path
          d={`M${cx - 6},42 L${cx + 6},42 L${cx + 4},50 L${cx - 4},50 Z`}
          fill={COLORS.surface2}
          stroke={COLORS.goldPremium}
          strokeWidth={1}
        />
        <Path
          d={`
            M${cx - shoulder / 2},52
            Q${cx - shoulder / 2 - 4},80 ${cx - chest / 2},92
            L${cx - waist / 2},150
            L${cx + waist / 2},150
            L${cx + chest / 2},92
            Q${cx + shoulder / 2 + 4},80 ${cx + shoulder / 2},52
            Z
          `}
          fill={COLORS.surface2}
          stroke={COLORS.goldPremium}
          strokeWidth={2}
        />
        <Path
          d={`M${cx - shoulder / 2},54 Q${cx - shoulder / 2 - 14},100 ${cx - shoulder / 2 - 8},150`}
          stroke={COLORS.goldPremium}
          strokeWidth={6 + muscle * 4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${cx + shoulder / 2},54 Q${cx + shoulder / 2 + 14},100 ${cx + shoulder / 2 + 8},150`}
          stroke={COLORS.goldPremium}
          strokeWidth={6 + muscle * 4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${cx - waist / 2 + 2},150 L${cx - thigh},245`}
          stroke={COLORS.goldPremium}
          strokeWidth={thigh - 4}
          strokeLinecap="round"
        />
        <Path
          d={`M${cx + waist / 2 - 2},150 L${cx + thigh},245`}
          stroke={COLORS.goldPremium}
          strokeWidth={thigh - 4}
          strokeLinecap="round"
        />
        <Path
          d={`M${cx - chest / 2 + 4},92 L${cx + chest / 2 - 4},92`}
          stroke={COLORS.goldMuted}
          strokeWidth={1}
          strokeDasharray="2,3"
        />
      </Svg>
      <Text style={styles.label}>Your Avatar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  label: { color: COLORS.goldPremium, fontSize: 11, letterSpacing: 1.5, marginTop: 4, fontWeight: "700" },
});
