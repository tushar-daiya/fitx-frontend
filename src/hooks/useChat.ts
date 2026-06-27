import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { ChatMessage, ChatSendResponse } from "@/src/types/api";

export const useChatHistory = (session_id: string) =>
  useQuery({
    queryKey: ["chat-history", session_id],
    queryFn: () =>
      apiFetch<ChatMessage[]>(`/chat/history?session_id=${session_id}`),
    staleTime: Infinity,
    enabled: !!session_id,
  });

export const useSendMessage = () =>
  useMutation({
    mutationFn: ({
      session_id,
      message,
    }: {
      session_id: string;
      message: string;
    }) =>
      apiFetch<ChatSendResponse>("/chat/send", {
        method: "POST",
        body: { session_id, message },
      }),
  });
