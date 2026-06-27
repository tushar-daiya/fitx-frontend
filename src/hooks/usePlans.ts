import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { PlanResponse } from "@/src/types/api";

export const useCurrentPlan = () =>
  useQuery({
    queryKey: ["plan-current"],
    queryFn: () => apiFetch<PlanResponse | null>("/plans/current"),
    staleTime: 5 * 60_000,
    retry: false,
  });

export const useGeneratePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<PlanResponse>("/plans/generate", { method: "POST" }),
    onSuccess: (data) => qc.setQueryData(["plan-current"], data),
  });
};
