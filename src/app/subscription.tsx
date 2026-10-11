import { useCreateOrder, useVerifyPayment } from "@/src/hooks/usePayments";
import {
  useSubscribe,
  useSubscriptionPlans,
  useSubscriptionStatus,
} from "@/src/hooks/useSubscription";
import { track } from "@/src/lib/analytics";
import { apiFetch } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth";
import { useT } from "@/src/store/i18n";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";
import type { PaymentOrder } from "@/src/types/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppEventsLogger } from "react-native-fbsdk-next";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

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

const USD_PRICES: Record<string, number> = { "1m": 12, "3m": 25, "6m": 40, "12m": 65 };

const isTrialPlan = (p: any): boolean => !!p && (p.is_trial === true || p.id === "trial");
const usdPrice = (p: any): number | undefined =>
  p?.price_usd ?? USD_PRICES[p?.id];

const DEFAULT_PERKS = [
  "c.sub.perk1",
  "c.sub.perk2",
  "c.sub.perk3",
  "c.sub.perk4",
];

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
    theme: { color: "${COLORS.gold}" },
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
  const t = useT();
  const { refresh } = useAuthStore();
  const { firstRun: firstRunParam } = useLocalSearchParams<{ firstRun?: string }>();
  const firstRun = firstRunParam === "1";
  const [region, setRegion] = useState<Region>("in");
  const [selected, setSelected] = useState<string>("");
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [webviewHtml, setWebviewHtml] = useState<string | null>(null);

  const { data: rawPlans = [], isLoading: plansLoading } = useSubscriptionPlans();
  // Trial (if eligible) always first, rest keep backend order.
  const plans = React.useMemo(
    () => [...rawPlans.filter(isTrialPlan), ...rawPlans.filter((p) => !isTrialPlan(p))],
    [rawPlans],
  );
  const trialPlan = plans.find(isTrialPlan);
  const trialDays = trialPlan?.days ?? 7;
  const { data: status, refetch: refetchStatus } = useSubscriptionStatus();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();
  const subscribe = useSubscribe();

  // Set default selected plan once plans load
  React.useEffect(() => {
    if (plans.length > 0 && !selected) {
      // First-run: preselect the trial if eligible, else the popular paid plan.
      const pick = firstRun
        ? (trialPlan ?? plans.find((p) => p.popular) ?? plans[0])
        : plans[0];
      setSelected(pick.id);
    }
  }, [plans]);

  // First-run users who somehow already have an active plan skip this screen.
  React.useEffect(() => {
    if (firstRun && status?.active) router.replace("/(tabs)/home");
  }, [firstRun, status?.active]);

  const viewedTracked = React.useRef(false);
  React.useEffect(() => {
    if (firstRun && !plansLoading && !viewedTracked.current) {
      viewedTracked.current = true;
      track("plans_viewed_at_signup", {
        trial_available: !!trialPlan,
        plan_count: plans.length,
      });
    }
  }, [firstRun, plansLoading, plans.length]);

  const queuedPlanIds = new Set<string>([
    ...(status?.active_plans.map((s) => s.plan) ?? []),
    ...(status?.upcoming_plans.map((s) => s.plan) ?? []),
  ]);

  const busy =
    createOrder.isPending || verifyPayment.isPending || subscribe.isPending;

  const startTrial = () => {
    track("trial_chosen", { source: firstRun ? "signup" : "plans" });
    track("begin_checkout", { plan: "trial", is_trial: true });
    subscribe.mutate("trial", {
      onSuccess: async (res) => {
        track("trial_started", {
          plan: "trial",
          value: 0,
          trial_ends: res?.ends,
        });
        AppEventsLogger.logEvent(AppEventsLogger.AppEvents.StartTrial, {
          fb_content_type: "subscription",
          fb_description: "trial",
        });
        await refresh();
        router.replace("/(tabs)/home");
      },
      onError: (e: any) => {
        track("trial_failed", { plan: "trial", reason: e?.message });
        Alert.alert(t("c.error"), e.message);
      },
    });
  };

  const payWithWebView = () => {
    const currency = region === "in" ? "INR" : "USD";
    const plan = plans.find((p) => p.id === selected);
    const value = region === "in" ? plan?.price : usdPrice(plan);
    track("paid_plan_chosen", {
      plan: selected,
      currency,
      value: value ?? 0,
      source: firstRun ? "signup" : "plans",
    });
    track("begin_checkout", {
      plan: selected,
      currency,
      value: value ?? 0,
      is_trial: false,
    });
    createOrder.mutate(
      { plan: selected, currency },
      {
        onSuccess: (order) => setWebviewHtml(buildRazorpayHtml(order)),
        onError: (e: any) => {
          track("purchase_failed", {
            plan: selected,
            stage: "create_order",
            reason: e?.message,
          });
          Alert.alert(t("c.error"), e.message);
        },
      },
    );
  };

  const activateNow = async (sub: SubEntry) => {
    setActivatingId(sub.id);
    try {
      await apiFetch(`/subscription/activate/${sub.id}`, { method: "POST" });
      await refresh();
      refetchStatus();
      Alert.alert(
        t("c.sub.activated"),
        t("c.sub.activated_msg").replace("{plan}", planLabel(sub.plan, plans)),
      );
    } catch (e: any) {
      Alert.alert(t("c.error"), e.message);
    } finally {
      setActivatingId(null);
    }
  };

  const onSubscribe = () => {
    if (isTrialPlan(plans.find((p) => p.id === selected))) return startTrial();
    return payWithWebView();
  };

  const displayPrice = (p: any) => {
    if (p.price === 0) return t("c.sub.free");
    if (region === "in") return `₹${p.price}`;
    return `$${usdPrice(p) ?? "—"}`;
  };

  const ctaLabel = () => {
    if (!selected) return t("c.sub.loading");
    const plan = plans.find((p) => p.id === selected);
    if (isTrialPlan(plan)) return t("c.sub.start_trial");
    if (!plan) return t("c.sub.proceed");
    const queued = queuedPlanIds.has(selected);
    return queued
      ? t("c.sub.already_queued").replace("{plan}", plan.label.toUpperCase())
      : t("c.sub.pay").replace("{price}", displayPrice(plan));
  };

  const ctaDisabled =
    busy ||
    !selected ||
    (!isTrialPlan(plans.find((p) => p.id === selected)) &&
      queuedPlanIds.has(selected));

  return (
    <SafeAreaView
      style={styles.container}
      testID="subscription-screen"
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        {firstRun ? (
          <View style={{ width: 26 }} />
        ) : (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{firstRun ? t("c.sub.choose_plan") : t("c.sub.subscription")}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{firstRun ? t("c.sub.all_set") : t("c.sub.your_plans")}</Text>
        <Text style={styles.sub}>
          {trialPlan
            ? t("c.sub.sub_trial").replace("{n}", String(trialDays))
            : t("c.sub.sub_plain")}
        </Text>

        {status?.active_plans && status.active_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("c.sub.active")}</Text>
            {status.active_plans.map((s) => (
              <ActivePlanCard key={s.id} sub={s} plans={plans} />
            ))}
          </View>
        )}

        {status?.upcoming_plans && status.upcoming_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("c.sub.upcoming")}</Text>
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

        {status &&
          !status.active &&
          status.active_plans.length === 0 &&
          (status.history.length > 0 ? (
            <View style={styles.noticeBanner}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.noticeText}>
                {t("c.sub.expired_notice")}
              </Text>
            </View>
          ) : (
            <View style={styles.welcomeBanner}>
              <Ionicons name="sparkles" size={20} color={COLORS.goldPremium} />
              <Text style={styles.welcomeText}>
                {trialPlan
                  ? t("c.sub.welcome_trial").replace("{n}", String(trialDays))
                  : t("c.sub.welcome_plain")}
              </Text>
            </View>
          ))}

        {status?.history && status.history.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setShowHistory((v) => !v)}
            >
              <Text style={styles.sectionTitle}>{t("c.sub.history")}</Text>
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
        <Text style={styles.title2}>{firstRun ? t("c.sub.pick_start") : t("c.sub.add_plan")}</Text>

        <View style={styles.regionRow}>
          <TouchableOpacity
            testID="region-in"
            onPress={() => {
              setRegion("in");
              track("region_select", { region: "in" });
            }}
            style={[
              styles.regionBtn,
              region === "in" && styles.regionBtnActive,
            ]}
          >
            <Text style={styles.regionFlag}>🇮🇳</Text>
            <Text
              style={[
                styles.regionText,
                region === "in" && styles.regionTextActive,
              ]}
            >
              {t("c.sub.india")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="region-global"
            onPress={() => {
              setRegion("global");
              track("region_select", { region: "global" });
            }}
            style={[
              styles.regionBtn,
              region === "global" && styles.regionBtnActive,
            ]}
          >
            <Text style={styles.regionFlag}>🌍</Text>
            <Text
              style={[
                styles.regionText,
                region === "global" && styles.regionTextActive,
              ]}
            >
              {t("c.sub.global")}
            </Text>
          </TouchableOpacity>
        </View>

        {plans.map((p, idx) => {
          const trialCard = isTrialPlan(p);
          const showPaidHeader =
            firstRun && !trialCard && (idx === 0 || isTrialPlan(plans[idx - 1]));
          const isSel = selected === p.id;
          const isActive = status?.active_plans.some((s) => s.plan === p.id);
          const isUpcoming = status?.upcoming_plans.some(
            (s) => s.plan === p.id,
          );
          const isQueued = isActive || isUpcoming;
          return (
            <React.Fragment key={p.id}>
            {showPaidHeader && (
              <Text style={styles.title2}>
                {trialPlan ? t("c.sub.or_buy") : t("c.sub.choose_a_plan")}
              </Text>
            )}
            <TouchableOpacity
              testID={`plan-${p.id}`}
              activeOpacity={0.9}
              onPress={() => {
                setSelected(p.id);
                track("select_item", {
                  item_id: p.id,
                  is_trial: trialCard,
                  currency: region === "in" ? "INR" : "USD",
                  value: region === "in" ? p.price : (usdPrice(p) ?? 0),
                });
              }}
              style={[
                styles.card,
                isSel && styles.cardActive,
                isActive && styles.cardCurrent,
                isUpcoming && styles.cardUpcoming,
              ]}
            >
              {isActive ? (
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>{t("c.sub.active")}</Text>
                </View>
              ) : isUpcoming ? (
                <View style={[styles.badge, styles.badgeUpcoming]}>
                  <Text style={styles.badgeText}>{t("c.sub.queued_badge")}</Text>
                </View>
              ) : p.badge || p.popular ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {(p.badge || t("c.sub.most_popular")).toUpperCase()}
                  </Text>
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
                  {isSel && (
                    <Ionicons name="checkmark" size={16} color={COLORS.onAccent} />
                  )}
                </View>
              </View>
              {(p.perks?.length ? p.perks : DEFAULT_PERKS).map((perk: string, i: number) => (
                <View key={i} style={styles.perkRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.goldPremium}
                  />
                  <Text style={styles.perkText}>{p.perks?.length ? perk : t(perk)}</Text>
                </View>
              ))}
            </TouchableOpacity>
            </React.Fragment>
          );
        })}

        {plans.length > 0 && !trialPlan && !firstRun && (
          <View style={styles.trialUsedCard}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={COLORS.textMuted}
            />
            <Text style={styles.trialUsedText}>
              {t("c.sub.trial_used")}
            </Text>
          </View>
        )}

        <View style={styles.trustRow}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={COLORS.goldPremium}
          />
          <Text style={styles.trustText}>
            {region === "in" ? t("c.sub.trust_in") : t("c.sub.trust_global")}
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
              <ActivityIndicator color={COLORS.onAccent} />
            ) : (
              <Text style={styles.ctaText}>{ctaLabel()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {webviewHtml && (
        <Modal visible animationType="slide">
          <SafeAreaView
            style={{ flex: 1, backgroundColor: COLORS.bg }}
            edges={["top"]}
          >
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
                        const plan = plans.find((p) => p.id === selected);
                        const currency = region === "in" ? "INR" : "USD";
                        const value =
                          region === "in" ? plan?.price : usdPrice(plan);
                        track("purchase", {
                          transaction_id: msg.razorpay_payment_id,
                          plan: selected,
                          currency,
                          value: value ?? 0,
                          status: result.status,
                          queued: result.status === "upcoming",
                        });
                        AppEventsLogger.logPurchase(value ?? 0, currency, {
                          fb_content_type: "subscription",
                        });
                        await refresh();
                        refetchStatus();
                        const isQueued = result.status === "upcoming";
                        if (firstRun && !isQueued) {
                          router.replace("/(tabs)/home");
                          return;
                        }
                        Alert.alert(
                          isQueued ? t("c.sub.plan_queued") : t("c.sub.welcome_premium"),
                          isQueued
                            ? t("c.sub.queued_msg").replace("{plan}", selected.toUpperCase()).replace("{date}", fmtDate(result.starts_at))
                            : t("c.sub.now_active"),
                        );
                      },
                      onError: (e: any) => {
                        track("purchase_failed", {
                          plan: selected,
                          stage: "verify",
                          reason: e?.message,
                        });
                        Alert.alert(
                          t("c.sub.almost"),
                          e.message ||
                            t("c.sub.confirm_fail"),
                        );
                      },
                    },
                  );
                } else {
                  track("purchase_cancelled", {
                    plan: selected,
                    reason: msg.type,
                  });
                  Alert.alert(
                    t("c.sub.cancelled"),
                    (msg as any).description ?? "",
                  );
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
  const t = useT();
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
          <Text style={styles.daysChipText}>{t("c.sub.days_short").replace("{n}", String(sub.days_remaining))}</Text>
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
                            86400000,
                        ),
                      )) *
                    100,
                ),
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
  const t = useT();
  return (
    <View style={[styles.subCard, styles.subCardUpcoming]}>
      <View style={styles.subCardRow}>
        <Ionicons name="time-outline" size={22} color={COLORS.goldPremium} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.subCardTitle}>{planLabel(sub.plan, plans)}</Text>
          <Text style={styles.subCardDate}>
            {t("c.sub.starts").replace("{date}", fmtDate(sub.starts_at))} → {fmtDate(sub.ends_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.activateBtn}
        onPress={onActivate}
        disabled={activating}
      >
        {activating ? (
          <ActivityIndicator size="small" color={COLORS.onAccent} />
        ) : (
          <>
            <Ionicons name="flash" size={14} color={COLORS.onAccent} />
            <Text style={styles.activateBtnText}>{t("c.sub.activate_now")}</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.activateHint}>
        {t("c.sub.activate_hint")}
      </Text>
    </View>
  );
}

function HistoryCard({ sub, plans }: { sub: SubEntry; plans: any[] }) {
  const t = useT();
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
          <Text style={[styles.daysChipText, { color: COLORS.textMuted }]}>
            {t("c.sub.expired")}
          </Text>
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
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  scroll: { padding: SPACING.l, paddingBottom: 40 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: FONTS.headingBold,
  },
  title2: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 12,
    fontFamily: FONTS.headingBold,
  },
  sub: {
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: FONTS.bodyBold,
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
    backgroundColor: COLORS.errorTint,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: { color: COLORS.textPrimary, fontSize: 13, flex: 1, lineHeight: 18, fontFamily: FONTS.body },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.goldTint,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
  },
  welcomeText: { color: COLORS.textPrimary, fontSize: 13, flex: 1, lineHeight: 18, fontFamily: FONTS.body },
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
  subCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: FONTS.bodyBold,
  },
  subCardTitleMuted: { color: COLORS.textMuted },
  subCardDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  daysChip: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysChipExpired: { backgroundColor: COLORS.surfaceElevated },
  daysChipText: {
    color: COLORS.onAccent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: FONTS.bodyBold,
  },
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
  activateBtnText: {
    color: COLORS.onAccent,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  activateHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 15,
    fontFamily: FONTS.body,
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
  regionText: {
    color: COLORS.textSecondary,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontSize: 13,
    fontFamily: FONTS.bodyBold,
  },
  regionTextActive: { color: COLORS.onAccent },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  cardActive: { borderColor: COLORS.goldPremium, backgroundColor: COLORS.goldTint },
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
  badgeUpcoming: { backgroundColor: COLORS.goldMuted },
  badgeText: {
    color: COLORS.onAccent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  planLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  price: {
    color: COLORS.goldPremium,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
    fontFamily: FONTS.headingBold,
  },
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
  radioActive: {
    backgroundColor: COLORS.goldPremium,
    borderColor: COLORS.goldPremium,
  },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  perkText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.body },
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
  trialUsedText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginTop: 8,
  },
  trustText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
    fontFamily: FONTS.body,
  },
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
  ctaText: {
    color: COLORS.onAccent,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
  },
});
