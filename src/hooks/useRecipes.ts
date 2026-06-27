import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { Recipe, DietType } from "@/src/types/api";

export const useRecipes = (diet?: DietType | "all") =>
  useQuery({
    queryKey: ["recipes", diet ?? "all"],
    queryFn: () => {
      const qs = diet && diet !== "all" ? `?diet=${diet}` : "";
      return apiFetch<Recipe[]>(`/recipes${qs}`);
    },
    staleTime: 10 * 60_000,
  });

export const useRecipe = (id: string) =>
  useQuery({
    queryKey: ["recipe", id],
    queryFn: () => apiFetch<Recipe>(`/recipes/${id}`),
    staleTime: 10 * 60_000,
    enabled: !!id,
  });

export const useCreateRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Recipe, "id" | "created_at">) =>
      apiFetch<Recipe>("/admin/recipes", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useDeleteRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rid: string) =>
      apiFetch<{ ok: boolean }>(`/admin/recipes/${rid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};
