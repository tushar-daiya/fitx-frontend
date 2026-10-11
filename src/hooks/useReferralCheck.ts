import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { clearPendingReferral, REFERRAL_CODE_LENGTH } from "@/src/lib/referral";

// idle: nothing to check yet (empty or still being typed)
// unverified: the check itself failed (offline / rate-limited); the server
//   re-validates on signup, so this never blocks the form.
export type ReferralStatus = "idle" | "checking" | "valid" | "invalid" | "unverified";

export type ReferralBlocker = "checking" | "invalid" | "incomplete";

type ValidateResponse = { valid: boolean; enabled: boolean; referrer_first_name?: string };

/**
 * Live referral-code validation for the signup form.
 *
 * Codes the user typed are checked and any mismatch is surfaced as an error.
 * Codes filled in automatically (install referrer, clipboard, deep link) are
 * checked too, but a bad one is dropped silently — a stale clipboard value
 * must never get in the way of signing up.
 */
export function useReferralCheck() {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [status, setStatus] = useState<ReferralStatus>("idle");
  const [referrer, setReferrer] = useState("");
  const latest = useRef(0);

  const clear = useCallback(() => {
    latest.current++;
    setCode("");
    setOpen(false);
    setAutoFilled(false);
    setStatus("idle");
    setReferrer("");
    clearPendingReferral();
  }, []);

  const type = useCallback((v: string) => {
    setAutoFilled(false);
    setCode(v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, REFERRAL_CODE_LENGTH));
  }, []);

  const autoFill = useCallback((v: string) => {
    if (!v) return;
    setAutoFilled(true);
    setCode((cur) => cur || v.toUpperCase().slice(0, REFERRAL_CODE_LENGTH));
  }, []);

  useEffect(() => {
    setReferrer("");
    if (code.length < REFERRAL_CODE_LENGTH) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      try {
        const r = await apiFetch<ValidateResponse>(
          `/referrals/validate?code=${encodeURIComponent(code)}`,
          { auth: false },
        );
        if (id !== latest.current) return;
        if (r.valid) {
          setReferrer(r.referrer_first_name || "a friend");
          setStatus("valid");
        } else if (autoFilled) {
          clear();
        } else {
          setStatus("invalid");
        }
      } catch {
        if (id === latest.current) setStatus("unverified");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [code, autoFilled, clear]);

  /** Why the form can't be submitted yet because of the referral code, if at all.
   * A code (not text) so the screen can show it in the user's language. */
  const blocker: ReferralBlocker | null = !code
    ? null
    : status === "checking"
      ? "checking"
      : status === "invalid"
        ? "invalid"
        : code.length < REFERRAL_CODE_LENGTH
          ? "incomplete"
          : null;

  return { code, type, autoFill, clear, open, setOpen, autoFilled, status, referrer, blocker };
}
