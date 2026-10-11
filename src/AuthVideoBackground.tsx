import React from "react";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/src/theme";

const introVideo = require("../assets/intro_video.mp4");

/** Full-screen looping, muted video backdrop for the auth screens, with a
 * dark gradient overlay so form text/inputs stay readable over any footage. */
export function AuthVideoBackground({ children }: { children: React.ReactNode }) {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(13,13,13,0.55)", "rgba(13,13,13,0.85)", COLORS.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1 },
});
