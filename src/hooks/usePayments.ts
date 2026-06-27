import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import type { PaymentOrder, PaymentVerifyResponse, PaymentRecord } from "@/src/types/api";

export const useCreateOrder = () =>
  useMutation({
    mutationFn: ({
      plan,
      currency,
    }: {
      plan: string;
      currency?: string;
    }) =>
      apiFetch<PaymentOrder>("/payments/create-order", {
        method: "POST",
        body: { plan, currency: currency ?? "INR" },
      }),
  });

export const useVerifyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) =>
      apiFetch<PaymentVerifyResponse>("/payments/verify", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
};

export const usePaymentStatus = (order_id: string) =>
  useQuery({
    queryKey: ["payment-status", order_id],
    queryFn: () => apiFetch<PaymentRecord>(`/payments/status/${order_id}`),
    enabled: !!order_id,
    staleTime: 30_000,
  });
