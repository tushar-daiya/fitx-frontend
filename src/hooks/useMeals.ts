import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { MealsToday, ScanResult, MealLog, MealType } from "@/src/types/api";

export const useMealsToday = () =>
  useQuery({
    queryKey: ["meals-today"],
    queryFn: () => apiFetch<MealsToday>("/meals/today"),
    staleTime: 60_000,
  });

export const useScanMeal = () =>
  useMutation({
    mutationFn: (image_base64: string) =>
      apiFetch<ScanResult>("/meals/scan", {
        method: "POST",
        body: { image_base64 },
      }),
  });

export const useLogMeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      meal_type?: MealType;
      is_cheat?: boolean;
      image_base64?: string | null;
    }) => apiFetch<MealLog>("/meals/log", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals-today"] }),
  });
};

export const useDeleteMeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meal_id: string) =>
      apiFetch<{ ok: boolean }>(`/meals/${meal_id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals-today"] }),
  });
};
