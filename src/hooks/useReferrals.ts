import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { ReferralItem, ReferralSummary } from "@/src/types/api";

export const useReferralSummary = () =>
  useQuery({
    queryKey: ["referrals-me"],
    queryFn: () => apiFetch<ReferralSummary>("/referrals/me"),
  });

export const useReferralList = () =>
  useQuery({
    queryKey: ["referrals-list"],
    queryFn: () => apiFetch<{ items: ReferralItem[] }>("/referrals/list"),
  });
