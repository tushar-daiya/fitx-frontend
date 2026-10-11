import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useLogSteps } from "@/src/hooks/useDaily";
import { getStepsStatus, readTodaySteps, requestStepsAccess, type StepsStatus } from "@/src/lib/steps";

const REFRESH_MS = 5 * 60_000;

/**
 * Keeps today's step count in sync with the device's own step data.
 * `status === "ready"` means steps are tracked automatically; any other status
 * means the Home card should offer manual entry or an access prompt.
 */
export function useStepsSync(serverSteps: number) {
  const logSteps = useLogSteps();
  const [status, setStatus] = useState<StepsStatus | null>(null);
  const last = useRef<number>(serverSteps);
  const busy = useRef(false);

  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const s = await getStepsStatus();
      setStatus(s);
      if (s !== "ready") return;
      const steps = await readTodaySteps();
      if (steps != null && steps !== last.current) {
        last.current = steps;
        logSteps.mutate(steps);
      }
    } finally {
      busy.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    last.current = serverSteps;
  }, [serverSteps]);

  useEffect(() => {
    sync();
    const timer = setInterval(sync, REFRESH_MS);
    const sub = AppState.addEventListener("change", (s) => s === "active" && sync());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [sync]);

  /** Prompt for access, then sync straight away. */
  const enable = useCallback(async () => {
    const s = await requestStepsAccess();
    setStatus(s);
    if (s === "ready") await sync();
    return s;
  }, [sync]);

  return { status, enable };
}
