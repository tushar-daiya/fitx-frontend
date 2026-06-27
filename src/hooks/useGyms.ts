import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { GymsResponse } from "@/src/types/api";

export const useGyms = (
  coords: { lat: number; lon: number; radius_m?: number } | null
) =>
  useQuery({
    queryKey: ["gyms", coords?.lat, coords?.lon],
    queryFn: () => {
      const { lat, lon, radius_m = 5000 } = coords!;
      return apiFetch<GymsResponse>(
        `/gyms/nearby?lat=${lat}&lon=${lon}&radius_m=${radius_m}`
      );
    },
    enabled: !!coords,
    staleTime: 5 * 60_000,
  });
