import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { AdminStats, FitXUser, NotificationResponse } from "@/src/types/api";

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
    staleTime: 60_000,
  });

export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<FitXUser[]>("/admin/users"),
    staleTime: 60_000,
  });

export const useSendNotification = () =>
  useMutation({
    mutationFn: (body: { title: string; body: string }) =>
      apiFetch<NotificationResponse>("/admin/send-notification", {
        method: "POST",
        body,
      }),
  });

export const useRegisterDeviceToken = () =>
  useMutation({
    mutationFn: (body: {
      token: string;
      platform: "android" | "ios" | "web" | "unknown";
    }) =>
      apiFetch<{ ok: boolean }>("/device-token", { method: "POST", body }),
  });
