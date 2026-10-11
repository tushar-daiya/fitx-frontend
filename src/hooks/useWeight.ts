import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth";
import type { WeightEntry, WeightHistory } from "@/src/types/api";

export const useWeightHistory = () =>
  useQuery({
    queryKey: ["weight-history"],
    queryFn: () => apiFetch<WeightHistory>("/weight/history"),
  });

// A weigh-in changes the profile weight (calorie targets) and the progress
// estimate, so refresh everything that reads them.
const useAfterWeightChange = () => {
  const qc = useQueryClient();
  const refresh = useAuthStore((s) => s.refresh);
  return () => {
    qc.invalidateQueries({ queryKey: ["weight-history"] });
    qc.invalidateQueries({ queryKey: ["avatar-progress"] });
    refresh();
  };
};

/** Local calendar date as YYYY-MM-DD (the server's clock is UTC). */
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const useLogWeight = () => {
  const after = useAfterWeightChange();
  return useMutation({
    mutationFn: (weight_kg: number) =>
      apiFetch<WeightEntry>("/weight/log", {
        method: "POST",
        body: { weight_kg, date: localDate() },
      }),
    onSuccess: after,
  });
};

export const useDeleteWeight = () => {
  const after = useAfterWeightChange();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/weight/${id}`, { method: "DELETE" }),
    onSuccess: after,
  });
};
