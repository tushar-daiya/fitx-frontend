import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { MealsHistory, MealsToday, ScanResult, MealLog, MealType } from "@/src/types/api";

export type MealInput = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  meal_type?: MealType;
  is_cheat?: boolean;
  image_base64?: string | null;
  source?: "ai" | "manual";
  // YYYY-MM-DD; defaults to today on the server.
  date?: string;
};

export const useMealsToday = () =>
  useQuery({
    queryKey: ["meals-today"],
    queryFn: () => apiFetch<MealsToday>("/meals/today"),
    staleTime: 60_000,
  });

export const useMealsForDay = (date: string, enabled = true) =>
  useQuery({
    queryKey: ["meals-day", date],
    queryFn: () => apiFetch<MealsToday>(`/meals/day/${date}`),
    enabled: enabled && !!date,
  });

export const useMealsHistory = (days = 14) =>
  useQuery({
    queryKey: ["meals-history", days],
    queryFn: () => apiFetch<MealsHistory>(`/meals/history?days=${days}`),
  });

export const useScanMeal = () =>
  useMutation({
    mutationFn: (image_base64: string) =>
      apiFetch<ScanResult>("/meals/scan", {
        method: "POST",
        body: { image_base64 },
      }),
  });

// Every meal mutation changes both the Home totals and the diary list.
const useInvalidateMeals = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["meals-today"] });
    qc.invalidateQueries({ queryKey: ["meals-day"] });
    qc.invalidateQueries({ queryKey: ["meals-history"] });
  };
};

export const useLogMeal = () => {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (body: MealInput) =>
      apiFetch<MealLog>("/meals/log", { method: "POST", body }),
    onSuccess: invalidate,
  });
};

export const useUpdateMeal = () => {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<MealInput> & { id: string }) =>
      apiFetch<MealLog>(`/meals/${id}`, { method: "PUT", body }),
    onSuccess: invalidate,
  });
};

export const useDeleteMeal = () => {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (meal_id: string) =>
      apiFetch<{ ok: boolean }>(`/meals/${meal_id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
};
