import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { DailyTracking } from "@/src/types/api";

export const useDailyToday = () =>
  useQuery({
    queryKey: ["daily-today"],
    queryFn: () => apiFetch<DailyTracking>("/daily/today"),
    staleTime: 60_000,
  });

export const useLogWater = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (glasses: number) =>
      apiFetch<{ glasses: number }>("/water/log", {
        method: "POST",
        body: { glasses },
      }),
    onMutate: async (glasses) => {
      await qc.cancelQueries({ queryKey: ["daily-today"] });
      const prev = qc.getQueryData<DailyTracking>(["daily-today"]);
      qc.setQueryData<DailyTracking>(["daily-today"], (old) =>
        old ? { ...old, water_glasses: glasses } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["daily-today"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["daily-today"] }),
  });
};

export const useLogSteps = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (steps: number) =>
      apiFetch<{ steps: number }>("/steps/log", {
        method: "POST",
        body: { steps },
      }),
    onMutate: async (steps) => {
      await qc.cancelQueries({ queryKey: ["daily-today"] });
      const prev = qc.getQueryData<DailyTracking>(["daily-today"]);
      qc.setQueryData<DailyTracking>(["daily-today"], (old) =>
        old ? { ...old, steps } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["daily-today"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["daily-today"] }),
  });
};
