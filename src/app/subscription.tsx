import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useSubscriptionPlans, useSubscriptionStatus, useSubscribe } from "@/src/hooks/useSubscription";
import { useCreateOrder, useVerifyPayment } from "@/src/hooks/usePayments";
import { useAuthStore } from "@/src/store/auth";
import { apiFetch } from "@/src/lib/api";
import { COLORS, RADIUS, SPACING } from "@/src/theme";
import type { PaymentOrder } from "@/src/types/api";

type Region = "in" | "global";

type SubEntry = {
  id: string;
  plan: string;
  status: "active" | "upcoming" | "expired";
  starts_at: string;
  ends_at: string;
  days_remaining: number;
  activated_by_user: boolean;
};

const USD_PRICES: Record<string, number> = { "3m": 25, "6m": 40, "12m": 65 };

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function planLabel(planId: string, planList: any[]): string {
  return planList.find((p) => p.id === planId)?.label || planId.toUpperCase();
}

function buildRazorpayHtml(order: PaymentOrder): string {
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var options = {
    key: "${order.key_id}",
    amount: "${order.amount}",
    currency: "${order.currency}",
    order_id: "${order.order_id}",
    name: "FitX",
    description: "Subscription",
    theme: { color: "#D4AF37" },
    handler: function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "success", ...response }));
    },
    modal: {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "dismiss" }));
      }
    }
  };
  var rzp = new Razorpay(options);
  rzp.on("payment.failed", function(r) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "failed", ...r.error }));
  });
  rzp.open();
<\/script>
</body>
</html>`;
}

export default function Subscription() {
  const router = useRouter();
  const { refresh } = useAuthStore();
  const [region, setRegion] = useState<Region>("in");
  const [selected, setSelected] = useState<string>("");
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [webviewHtml, setWebviewHtml] = useState<string | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: status, refetch: refetchStatus } = useSubscriptionStatus();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();
  const subscribe = useSubscribe();

  // Set default selected plan once plans load
  React.useEffect(() => {
    if (plans.length > 0 && !selected) setSelected(plans[0].id);
  }, [plans]);

  const queuedPlanIds = new Set<string>([
    ...(status?.active_plans.map((s) => s.plan) ?? []),
    ...(status?.upcoming_plans.map((s) => s.plan) ?? []),
  ]);

  const busy = createOrder.isPending || verifyPayment.isPending || subscribe.isPending;

  const startTrial = () => {
    subscribe.mutate("trial", {
      onSuccess: async () => {
        await refresh();
        router.replace("/(tabs)/home");
      },
      onError: (e: any) => Alert.alert("Error", e.message),
    });
  };

  const payWithWebView = () => {
    const currency = region === "in" ? "INR" : "USD";
    createOrder.mutate({ plan: selected, currency }, {
      onSuccess: (order) => setWebviewHtml(buildRazorpayHtml(order)),
      onError: (e: any) => Alert.alert("Error", e.message),
    });
  };

  const activateNow = async (sub: SubEntry) => {
    setActivatingId(sub.id);
    try {
      await apiFetch(`/subscription/activate/${sub.id}`, { method: "POST" });
      await refresh();
      refetchStatus();
      Alert.alert("Plan Activated", `Your ${planLabel(sub.plan, plans)} plan is now active.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setActivatingId(null);
    }
  };

  const onSubscribe = () => {
    if (selected === "trial") return startTrial();
    return payWithWebView();
  };

  const displayPrice = (p: any) => {
    if (p.price === 0) return "FREE";
    if (region === "in") return `₹${p.price}`;
    return `$${USD_PRICES[p.id] ?? "—"}`;
  };

  const ctaLabel = () => {
    if (!selected) return "LOADING…";
    if (selected === "trial") return "START FREE TRIAL";
    const plan = plans.find((p) => p.id === selected);
    if (!plan) return "PROCEED TO PAY";
    const queued = queuedPlanIds.has(selected);
    return queued ? `${plan.label.toUpperCase()} ALREADY QUEUED` : `PAY ${displayPrice(plan)}`;
  };

  const ctaDisabled = busy || !selected || (selected !== "trial" && queuedPlanIds.has(selected));

  return (
    <SafeAreaView style={styles.container} testID="subscription-screen" edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Plans</Text>
        <Text style={styles.sub}>
          7-day free trial. Premium features include AI plans, meal scanner & coach.
        </Text>

        {status?.active_plans && status.active_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIVE</Text>
            {status.active_plans.map((s) => (
              <ActivePlanCard key={s.id} sub={s} plans={plans} />
            ))}
          </View>
        )}

        {status?.upcoming_plans && status.upcoming_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPCOMING</Text>
            {status.upcoming_plans.map((s) => (
              <UpcomingPlanCard
                key={s.id}
                sub={s}
                plans={plans}
                activating={activatingId === s.id}
                onActivate={() => activateNow(s)}
              />
            ))}
          </View>
        )}

        {status && !status.active && status.active_plans.length === 0 && (
          <View style={styles.noticeBanner}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.noticeText}>
              Your subscription has expired. Choose a plan below to restore access.
            </Text>
          </View>
        )}

        {status?.history && status.history.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setShowHistory((v) => !v)}
            >
              <Text style={styles.sectionTitle}>HISTORY</Text>
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={16}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            {showHistory &&
              status.history.map((s) => (
                <HistoryCard key={s.id} sub={s} plans={plans} />
              ))}
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.title2}>Add a New Plan</Text>

        <View style={styles.regionRow}>
          <TouchableOpacity
            testID="region-in"
            onPress={() => setRegion("in")}
            style={[styles.regionBtn, region === "in" && styles.regionBtnActive]}
          >
            <Text style={styles.regionFlag}>🇮🇳</Text>
            <Text style={[styles.regionText, region === "in" && styles.regionTextActive]}>
              India · ₹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="region-global"
            onPress={() => setRegion("global")}
            style={[styles.regionBtn, region === "global" && styles.regionBtnActive]}
          >
            <Text style={styles.regionFlag}>🌍</Text>
            <Text style={[styles.regionText, region === "global" && styles.regionTextActive]}>
              Global · $
            </Text>
          </TouchableOpacity>
        </View>

        {plans.map((p) => {
          const isSel = selected === p.id;
          const isActive = status?.active_plans.some((s) => s.plan === p.id);
          const isUpcoming = status?.upcoming_plans.some((s) => s.plan === p.id);
          const isQueued = isActive || isUpcoming;
          return (
            <TouchableOpacity
              key={p.id}
              testID={`plan-${p.id}`}
              activeOpacity={0.9}
              onPress={() => setSelected(p.id)}
              style={[
                styles.card,
                isSel && styles.cardActive,
                isActive && styles.cardCurrent,
                isUpcoming && styles.cardUpcoming,
              ]}
            >
              {isActive ? (
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>ACTIVE</Text>
                </View>
              ) : isUpcoming ? (
                <View style={[styles.badge, styles.badgeUpcoming]}>
                  <Text style={styles.badgeText}>QUEUED</Text>
                </View>
              ) : p.popular ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>MOST POPULAR</Text>
                </View>
              ) : null}

              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planLabel}>{p.label}</Text>
                  <Text style={[styles.price, isQueued && styles.priceQueued]}>
                    {displayPrice(p)}
                  </Text>
                </View>
                <View style={[styles.radio, isSel && styles.radioActive]}>
                  {isSel && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
              </View>
              {p.perks.map((perk: string, i: number) => (
                <View key={i} style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.goldPremium} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}

        {plans.length > 0 && !plans.some((p) => p.id === "trial") && (
          <View style={styles.trialUsedCard}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.textMuted} />
            <Text style={styles.trialUsedText}>7-Day Free Trial — already used on this account</Text>
          </View>
        )}

        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.goldPremium} />
          <Text style={styles.trustText}>
            {region === "in"
              ? "UPI · Cards · Wallets · NetBanking · Secured by Razorpay"
              : "International cards · 256-bit SSL · Secured by Razorpay"}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]}>
        <View style={styles.footer}>
          <TouchableOpacity
            testID="subscribe-btn"
            style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
            onPress={onSubscribe}
            disabled={ctaDisabled}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>{ctaLabel()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {webviewHtml && (
        <Modal visible animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
            <WebView
              source={{ html: webviewHtml }}
              originWhitelist={["*"]}
              javaScriptEnabled
              onMessage={(e) => {
                const msg = JSON.parse(e.nativeEvent.data);
                setWebviewHtml(null);
                if (msg.type === "success") {
                  verifyPayment.mutate(
                    {
                      razorpay_order_id: msg.razorpay_order_id,
                      razorpay_payment_id: msg.razorpay_payment_id,
                      razorpay_signature: msg.razorpay_signature,
                    },
                    {
                      onSuccess: async (result) => {
                        await refresh();
                        refetchStatus();
                        const isQueued = result.status === "upcoming";
                        Alert.alert(
                          isQueued ? "Plan Queued" : "Welcome to FitX Premium",
                          isQueued
                            ? `Your ${selected.toUpperCase()} plan is scheduled to start on ${fmtDate(result.starts_at)} — right after your current plan ends.`
                            : "Your subscription is now active."
                        );
                      },
                      onError: (e: any) =>
                        Alert.alert(
                          "Almost there",
                          e.message || "We couldn't confirm your payment just now. If you were charged, your access will unlock shortly."
                        ),
                    }
                  );
                } else {
                  Alert.alert("Payment cancelled", (msg as any).description ?? "");
                }
              }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function ActivePlanCard({ sub, plans }: { sub: SubEntry; plans: any[] }) {
  return (
    <View style={styles.subCard}>
      <View style={styles.subCardRow}>
        <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.subCardTitle}>{planLabel(sub.plan, plans)}</Text>
          <Text style={styles.subCardDate}>
            {fmtDate(sub.starts_at)} → {fmtDate(sub.ends_at)}
          </Text>
        </View>
        <View style={styles.daysChip}>
          <Text style={styles.daysChipText}>{sub.days_remaining}d</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(
                100,
                Math.round(
                  (1 -
                    sub.days_remaining /
                      Math.max(
                        1,
                        Math.round(
                          (new Date(sub.ends_at).getTime() -
                            new Date(sub.starts_at).getTime()) /
                            86400000
                        )
                      )) *
                    100
                )
              )}%` as any,
            },
          ]}
        />
      </View>
    </View>
  );
}

function UpcomingPlanCard({
  sub,
  plans,
  activating,
  onActivate,
}: {
  sub: SubEntry;
  plans: any[];
  activating: boolean;
  onActivate: () => void;
}) {
  return (
    <View style={[styles.subCard, styles.subCardUpcoming]}>
      <View style={styles.subCardRow}>
        <Ionicons name="time-outline" size={22} color={COLORS.goldPremium} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.subCardTitle}>{planLabel(sub.plan, plans)}</Text>
          <Text style={styles.subCardDate}>
            Starts {fmtDate(sub.starts_at)} → {fmtDate(sub.ends_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.activateBtn}
        onPress={onActivate}
        disabled={activating}
      >
        {activating ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Ionicons name="flash" size={14} color="#000" />
            <Text style={styles.activateBtnText}>ACTIVATE NOW</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.activateHint}>
        Activating starts this plan today. Your current plan keeps running.
      </Text>
    </View>
  );
}

function HistoryCard({ sub, plans }: { sub: SubEntry; plans: any[] }) {
  return (
    <View style={[styles.subCard, styles.subCardExpired]}>
      <View style={styles.subCardRow}>
        <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.subCardTitle, styles.subCardTitleMuted]}>
            {planLabel(sub.plan, plans)}
          </Text>
          <Text style={styles.subCardDate}>
            {fmtDate(sub.starts_at)} → {fmtDate(sub.ends_at)}
          </Text>
        </View>
        <View style={[styles.daysChip, styles.daysChipExpired]}>
          <Text style={[styles.daysChipText, { color: COLORS.textMuted }]}>EXPIRED</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.s,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  scroll: { padding: SPACING.l, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  title2: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3, marginBottom: 12 },
  sub: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  section: { marginBottom: 8 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#1a0505",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: { color: "#fff", fontSize: 13, flex: 1, lineHeight: 18 },
  subCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.success,
    marginBottom: 10,
  },
  subCardUpcoming: { borderColor: COLORS.goldPremium },
  subCardExpired: { borderColor: COLORS.border, opacity: 0.7 },
  subCardRow: { flexDirection: "row", alignItems: "center" },
  subCardTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  subCardTitleMuted: { color: COLORS.textMuted },
  subCardDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  daysChip: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysChipExpired: { backgroundColor: COLORS.surfaceElevated },
  daysChipText: { color: "#000", fontSize: 11, fontWeight: "900" },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: COLORS.success, borderRadius: 2 },
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    marginTop: 12,
  },
  activateBtnText: { color: "#000", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  activateHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 15,
  },
  regionRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: 18,
  },
  regionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    gap: 6,
  },
  regionBtnActive: { backgroundColor: COLORS.goldPremium },
  regionFlag: { fontSize: 16 },
  regionText: { color: COLORS.textSecondary, fontWeight: "800", letterSpacing: 0.5, fontSize: 13 },
  regionTextActive: { color: "#000" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  cardActive: { borderColor: COLORS.goldPremium, backgroundColor: "#1a1505" },
  cardCurrent: { borderColor: COLORS.success },
  cardUpcoming: { borderColor: COLORS.goldPremium },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.goldPremium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeActive: { backgroundColor: COLORS.success },
  badgeUpcoming: { backgroundColor: "#7C6A1E" },
  badgeText: { color: "#000", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  planLabel: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  price: { color: COLORS.goldPremium, fontSize: 32, fontWeight: "900", marginTop: 4 },
  priceQueued: { color: COLORS.textMuted },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { backgroundColor: COLORS.goldPremium, borderColor: COLORS.goldPremium },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  perkText: { color: COLORS.textSecondary, fontSize: 14 },
  trialUsedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    opacity: 0.5,
  },
  trialUsedText: { color: COLORS.textMuted, fontSize: 13 },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginTop: 8,
  },
  trustText: { color: COLORS.textSecondary, fontSize: 11, flex: 1, lineHeight: 16 },
  footer: {
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  cta: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#000", fontWeight: "900", letterSpacing: 1.5, fontSize: 15 },
});
