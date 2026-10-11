import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { storage } from "@/src/utils/storage";

// Deferred referral attribution — carries a referral code from the share link
// through the store install to the signup form.
//
// Android: the website sends people to Play with `&referrer=fitxref%3DCODE`;
//   the Play Install Referrer API hands that string back on first launch.
// iOS: there is no install referrer, so the website's /r/CODE page copies
//   `fitxref:CODE` to the clipboard and we pick it up here.
// Both paths also accept the `fitx://signup?ref=CODE` deep link (see signup.tsx).

const PENDING_KEY = "fitx_pending_referral";
const CHECKED_KEY = "fitx_referral_checked";
// Must match CODE_LENGTH in the backend (app/services/referrals.py).
export const REFERRAL_CODE_LENGTH = 8;
const CODE_RE = /^[A-Z0-9]{6,12}$/;

export const sanitizeCode = (raw?: string | null): string => {
  const code = (raw ?? "").trim().toUpperCase();
  return CODE_RE.test(code) ? code : "";
};

function readAndroidInstallReferrer(): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Required lazily so web/iOS bundles never touch the native module.
      const { PlayInstallReferrer } = require("react-native-play-install-referrer");
      PlayInstallReferrer.getInstallReferrerInfo((info: any, error: any) => {
        const m = /fitxref=([A-Za-z0-9]+)/.exec(info?.installReferrer ?? "");
        resolve(error || !m ? "" : sanitizeCode(m[1]));
      });
    } catch {
      resolve("");
    }
  });
}

async function readIosClipboard(): Promise<string> {
  try {
    // hasStringAsync doesn't trigger iOS's "pasted from" prompt, so only fall
    // through to the real read when there is something on the clipboard.
    if (!(await Clipboard.hasStringAsync())) return "";
    const m = /^fitxref:([A-Za-z0-9]+)$/.exec((await Clipboard.getStringAsync()).trim());
    return m ? sanitizeCode(m[1]) : "";
  } catch {
    return "";
  }
}

/** Referral code captured from the install source, if any. The store lookup
 * runs once per install; the result is remembered until signup consumes it. */
export async function getPendingReferral(): Promise<string> {
  const saved = sanitizeCode(await storage.getItem<string>(PENDING_KEY, ""));
  if (saved) return saved;
  if (await storage.getItem<string>(CHECKED_KEY, "")) return "";
  let code = "";
  if (Platform.OS === "android") code = await readAndroidInstallReferrer();
  else if (Platform.OS === "ios") code = await readIosClipboard();
  await storage.setItem(CHECKED_KEY, "1");
  if (code) await storage.setItem(PENDING_KEY, code);
  return code;
}

export const clearPendingReferral = () => storage.removeItem(PENDING_KEY);
