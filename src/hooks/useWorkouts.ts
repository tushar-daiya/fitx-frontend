import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { WorkoutVideo } from "@/src/types/api";

export const useWorkoutVideos = (type?: "home" | "gym", muscle?: string) =>
  useQuery({
    queryKey: ["workout-videos", type, muscle],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (muscle) params.set("muscle", muscle);
      const qs = params.toString() ? `?${params}` : "";
      return apiFetch<WorkoutVideo[]>(`/workouts/videos${qs}`);
    },
    staleTime: 10 * 60_000,
  });
