import React, { useEffect, useCallback } from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { router } from "expo-router";
import { useFonts } from "expo-font";
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from "@expo-google-fonts/barlow-condensed";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import QueryProvider from "@/src/provider/query";
import { PaywallGuard } from "@/src/PaywallGuard";
import { useAuthStore } from "@/src/store/auth";
import { COLORS } from "@/src/theme";
import { trackScreen, identifyUser, track } from "@/src/lib/analytics";
import { storage } from "@/src/utils/storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);
  const userId = useAuthStore((s) => s.user?.id);
  const pathname = usePathname();

  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  useEffect(() => {
    refresh();
  }, []);

  // App-open + first-open (download) tracking. Firebase auto-logs `first_open`,
  // but we also emit our own one-time `app_first_open` so it can be used in
  // custom funnels/audiences, and `app_open` on every launch.
  useEffect(() => {
    (async () => {
      track("app_open");
      const seen = await storage.getItem<string>("fitx_first_open_logged", "");
      if (!seen) {
        track("app_first_open");
        await storage.setItem("fitx_first_open_logged", "1");
      }
    })();
  }, []);

  // Automatic screen-view tracking on every route change.
  useEffect(() => {
    if (pathname) trackScreen(pathname === "/" ? "index" : pathname);
  }, [pathname]);

  // Tie all events to the logged-in user (cleared on logout).
  useEffect(() => {
    identifyUser(userId ? String(userId) : null);
  }, [userId]);

  useEffect(() => {
    const response = Notifications.getLastNotificationResponse();
    if (response) router.replace("/");
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.replace("/"));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" />
        <PaywallGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bg },
              animation: "fade",
            }}
          />
        </PaywallGuard>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
