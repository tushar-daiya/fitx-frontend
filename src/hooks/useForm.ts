import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, API, getToken } from "@/src/lib/api";
import type { FormExercise, FormAnalysisResult } from "@/src/types/api";

export const useFormExercises = () =>
  useQuery({
    queryKey: ["form-exercises"],
    queryFn: () => apiFetch<FormExercise[]>("/form/exercises"),
    staleTime: Infinity,
  });

// Video upload requires multipart/form-data — use XHR because React Native's
// fetch does not support file-like FormData entries (throws "Unsupported FormData part").
export const useAnalyzeForm = () =>
  useMutation({
    mutationFn: ({
      videoUri,
      exercise = "auto",
    }: {
      videoUri: string;
      exercise?: string;
    }) =>
      new Promise<FormAnalysisResult>(async (resolve, reject) => {
        const token = await getToken();
        const form = new FormData();
        form.append("video", {
          uri: videoUri,
          type: "video/mp4",
          name: "form.mp4",
        } as any);
        form.append("exercise", exercise);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/form/analyze`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Form analysis failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      }),
  });
