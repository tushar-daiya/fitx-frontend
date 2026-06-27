import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiFetch } from "@/src/lib/api";

export async function registerDevicePushToken(): Promise<void> {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const tokenData = await Notifications.getDevicePushTokenAsync();
  console.log("Push notification token:", tokenData);
  const platform =
    Platform.OS === "android"
      ? "android"
      : Platform.OS === "ios"
      ? "ios"
      : "unknown";

  await apiFetch("/device-token", {
    method: "POST",
    body: { token: tokenData.data, platform },
  });
}
