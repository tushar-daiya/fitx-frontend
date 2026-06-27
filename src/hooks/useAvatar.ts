import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { AvatarProgress } from "@/src/types/api";

export const useAvatarProgress = () =>
  useQuery({
    queryKey: ["avatar-progress"],
    queryFn: () => apiFetch<AvatarProgress>("/avatar/progress"),
    staleTime: 5 * 60_000,
  });
