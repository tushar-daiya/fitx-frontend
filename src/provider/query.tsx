import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,
      refetchInterval: 120_000
    }
  }
});

export default function QueryProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}