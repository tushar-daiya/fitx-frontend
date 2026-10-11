import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useGyms } from "@/src/hooks/useGyms";
import type { Gym } from "@/src/types/api";
import { useT } from "@/src/store/i18n";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

export default function GymsNearby() {
  const router = useRouter();
  const t = useT();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);

  const { data, isLoading: gymsBusy } = useGyms(coords);
  const gyms = data?.gyms ?? [];

  const busy = locBusy || (gymsBusy && !!coords);

  const search = useCallback(async () => {
    setLocBusy(true);
    setLocErr(null);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        if (!perm.canAskAgain) {
          setDenied(true);
          setLocErr("c.gym.err_denied");
          return;
        }
        perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== "granted") {
          setDenied(!perm.canAskAgain);
          setLocErr("c.gym.err_perm");
          return;
        }
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    } catch (e: any) {
      setLocErr(e.message || "c.gym.err_loc");
    } finally {
      setLocBusy(false);
    }
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  const openMap = (g: Gym) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${g.lat},${g.lon}&q=${encodeURIComponent(g.name)}`,
      android: `geo:${g.lat},${g.lon}?q=${encodeURIComponent(g.name)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${g.lat},${g.lon}`,
    });
    Linking.openURL(url!);
  };

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  const err = locErr;

  return (
    <SafeAreaView style={styles.container} testID="gyms-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.goldPremium} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("c.gym.title")}</Text>
        <TouchableOpacity onPress={search} disabled={busy}>
          <Ionicons name="refresh" size={22} color={busy ? COLORS.textMuted : COLORS.goldPremium} />
        </TouchableOpacity>
      </View>

      {busy && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.goldPremium} size="large" />
          <Text style={styles.loadingText}>{t("c.gym.finding")}</Text>
        </View>
      )}

      {!busy && err && (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.errTitle}>{t("c.gym.loc_needed")}</Text>
          <Text style={styles.errText}>{err.startsWith("c.gym.") ? t(err) : err}</Text>
          {denied ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.primaryBtnText}>{t("c.gym.open_settings")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={search}>
              <Text style={styles.primaryBtnText}>{t("c.gym.try_again")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!busy && !err && gyms.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="barbell-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.errTitle}>{t("c.gym.none")}</Text>
          <Text style={styles.errText}>{t("c.gym.none_sub")}</Text>
        </View>
      )}

      {!busy && gyms.length > 0 && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.subhead}>
            {t(gyms.length === 1 ? "c.gym.count_one" : "c.gym.count_many").replace("{n}", String(gyms.length))}
          </Text>
          {gyms.map((g, i) => (
            <View key={`${g.lat}-${g.lon}-${i}`} style={styles.card} testID={`gym-${i}`}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="barbell" size={22} color={COLORS.onAccent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.gymName}>{g.name}</Text>
                  <Text style={styles.gymDist}>{t("c.gym.away").replace("{d}", (g.distance_m / 1000).toFixed(2))}</Text>
                </View>
              </View>
              {g.address && <Text style={styles.gymAddr}>{g.address}</Text>}
              {g.opening_hours && (
                <Text style={styles.gymHours}>{g.opening_hours}</Text>
              )}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openMap(g)}>
                  <Ionicons name="navigate" size={16} color={COLORS.goldPremium} />
                  <Text style={styles.actionText}>{t("c.gym.directions")}</Text>
                </TouchableOpacity>
                {g.phone && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => call(g.phone!)}>
                    <Ionicons name="call" size={16} color={COLORS.goldPremium} />
                    <Text style={styles.actionText}>{t("c.gym.call")}</Text>
                  </TouchableOpacity>
                )}
                {g.website && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Linking.openURL(g.website!)}
                  >
                    <Ionicons name="globe" size={16} color={COLORS.goldPremium} />
                    <Text style={styles.actionText}>{t("c.gym.website")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <Text style={styles.footer}>{t("c.gym.powered")}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.l,
  },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", fontFamily: FONTS.headingBold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.l },
  loadingText: { color: COLORS.textSecondary, marginTop: 16, fontFamily: FONTS.body },
  errTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 12, fontFamily: FONTS.headingBold },
  errText: { color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20, fontFamily: FONTS.body },
  primaryBtn: {
    backgroundColor: COLORS.goldPremium,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  primaryBtnText: { color: COLORS.onAccent, fontWeight: "900", letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
  list: { padding: SPACING.l, paddingBottom: 40 },
  subhead: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 14, letterSpacing: 0.5, fontFamily: FONTS.body },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
  },
  gymName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", fontFamily: FONTS.headingSemiBold },
  gymDist: { color: COLORS.goldPremium, fontSize: 12, fontWeight: "700", marginTop: 2, fontFamily: FONTS.bodyBold },
  gymAddr: { color: COLORS.textSecondary, fontSize: 13, marginTop: 10, lineHeight: 18, fontFamily: FONTS.body },
  gymHours: { color: COLORS.textMuted, fontSize: 12, marginTop: 6, fontFamily: FONTS.body },
  actions: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  actionText: { color: COLORS.goldPremium, fontSize: 12, fontWeight: "700", letterSpacing: 0.3, fontFamily: FONTS.bodyBold },
  footer: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 0.5,
    fontFamily: FONTS.body,
  },
});
