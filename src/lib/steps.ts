import { Platform } from "react-native";

// Daily step count from the device itself.
//   iOS:     Core Motion pedometer (expo-sensors).
//   Android: Health Connect, which aggregates steps from whichever fitness
//            app/wearable writes them (Google Fit, Samsung Health, Mi Fitness...).
// Everything is best-effort: any failure reports "unsupported" so the app falls
// back to manual entry rather than crashing. Native modules are required lazily
// so web and unsupported builds never load them.

export type StepsStatus =
  | "unsupported" // no usable step source on this device
  | "needs_install" // Android: Health Connect is missing or needs updating
  | "needs_permission" // available, the user hasn't granted access yet
  | "ready";

const STEPS_READ = { accessType: "read", recordType: "Steps" } as const;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Android (Health Connect) ──────────────────────────────────────────────
async function androidStatus(): Promise<StepsStatus> {
  const hc = require("react-native-health-connect");
  const sdk = await hc.getSdkStatus();
  if (sdk === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE) return "unsupported";
  if (sdk === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return "needs_install";
  if (!(await hc.initialize())) return "unsupported";
  const granted: { accessType: string; recordType: string }[] = await hc.getGrantedPermissions();
  return granted.some((p) => p.recordType === "Steps" && p.accessType === "read") ? "ready" : "needs_permission";
}

async function androidRequest(): Promise<void> {
  const hc = require("react-native-health-connect");
  await hc.requestPermission([STEPS_READ]);
}

async function androidRead(): Promise<number> {
  const hc = require("react-native-health-connect");
  const r = await hc.aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: {
      operator: "between",
      startTime: startOfToday().toISOString(),
      endTime: new Date().toISOString(),
    },
  });
  return Math.round(r?.COUNT_TOTAL ?? 0);
}

// ── iOS (Core Motion) ─────────────────────────────────────────────────────
async function iosStatus(): Promise<StepsStatus> {
  const { Pedometer } = require("expo-sensors");
  if (!(await Pedometer.isAvailableAsync())) return "unsupported";
  const perm = await Pedometer.getPermissionsAsync();
  if (perm.granted) return "ready";
  return perm.canAskAgain ? "needs_permission" : "unsupported";
}

async function iosRequest(): Promise<void> {
  const { Pedometer } = require("expo-sensors");
  await Pedometer.requestPermissionsAsync();
}

async function iosRead(): Promise<number> {
  const { Pedometer } = require("expo-sensors");
  const r = await Pedometer.getStepCountAsync(startOfToday(), new Date());
  return Math.round(r?.steps ?? 0);
}

// ── Public API ────────────────────────────────────────────────────────────
export async function getStepsStatus(): Promise<StepsStatus> {
  try {
    if (Platform.OS === "android") return await androidStatus();
    if (Platform.OS === "ios") return await iosStatus();
  } catch {}
  return "unsupported";
}

/** Ask for access (system dialog), then report the resulting status. */
export async function requestStepsAccess(): Promise<StepsStatus> {
  try {
    if (Platform.OS === "android") await androidRequest();
    else if (Platform.OS === "ios") await iosRequest();
  } catch {}
  return getStepsStatus();
}

/** Today's steps since local midnight, or null if they can't be read. */
export async function readTodaySteps(): Promise<number | null> {
  try {
    if (Platform.OS === "android") return await androidRead();
    if (Platform.OS === "ios") return await iosRead();
  } catch {}
  return null;
}

/** Send the user to the Play Store page to install/update Health Connect. */
export const HEALTH_CONNECT_STORE_URL =
  "market://details?id=com.google.android.apps.healthdata";
