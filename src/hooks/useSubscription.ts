import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscribeResponse,
  ActivateSubscriptionResponse,
} from "@/src/types/api";

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => apiFetch<SubscriptionPlan[]>("/subscription/plans"),
    // Plans are admin-editable, so refetch whenever a screen using them mounts.
    staleTime: 30_000,
    refetchOnMount: "always",
  });

export const useSubscriptionStatus = (enabled = true) =>
  useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => apiFetch<SubscriptionStatus>("/subscription/status"),
    staleTime: 60_000,
    enabled,
  });

export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) =>
      apiFetch<SubscribeResponse>("/subscription/subscribe", {
        method: "POST",
        body: { plan },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
};

export const useActivateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub_id: string) =>
      apiFetch<ActivateSubscriptionResponse>(
        `/subscription/activate/${sub_id}`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
    },
  });
};
