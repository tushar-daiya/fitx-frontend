import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import QueryProvider from "@/src/provider/query";
import { PaywallGuard } from "@/src/PaywallGuard";
import { useAuthStore } from "@/src/store/auth";
import { COLORS } from "@/src/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const response = Notifications.getLastNotificationResponse();
    if (response) router.replace("/");
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.replace("/"));
    return () => sub.remove();
  }, []);

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
