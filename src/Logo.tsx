import React from "react";
import { Image, StyleSheet, ImageStyle, StyleProp } from "react-native";

const icon = require("../assets/images/icon.png");

type LogoProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function Logo({ size = 132, style }: LogoProps) {
  return (
    <Image
      source={icon}
      style={[styles.base, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "center",
  },
});
