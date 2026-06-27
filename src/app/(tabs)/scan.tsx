import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useScanMeal, useLogMeal } from "@/src/hooks/useMeals";
import { COLORS, RADIUS, SPACING } from "@/src/theme";
import type { ScanResult } from "@/src/types/api";

export default function Scan() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const scanMeal = useScanMeal();
  const logMeal = useLogMeal();

  const pick = async (fromCamera: boolean) => {
    setResult(null);
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please enable access to continue");
      return;
    }
    const r = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.6,
          base64: true,
          mediaTypes: "images",
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.6,
          base64: true,
          mediaTypes: "images",
        });
    if (r.canceled || !r.assets[0]) return;
    setImageUri(r.assets[0].uri);
    setImageB64(r.assets[0].base64 || null);
  };

  const scan = () => {
    if (!imageB64) return Alert.alert("Pick or take a meal photo first");
    scanMeal.mutate(imageB64, {
      onSuccess: setResult,
      onError: (e: any) => Alert.alert("Scan failed", e.message),
    });
  };

  const onLogMeal = () => {
    if (!result) return;
    logMeal.mutate(
      {
        name: result.name,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fats_g: result.fats_g,
        meal_type: "snack",
      },
      {
        onSuccess: () => {
          Alert.alert("Logged!", `${result.name} added to today's meals`);
          setResult(null);
          setImageUri(null);
          setImageB64(null);
        },
        onError: (e: any) => Alert.alert("Log failed", e.message),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="scan-screen" edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Scan Meal</Text>
        <Text style={styles.sub}>Snap your meal · AI estimates calories & macros</Text>

        <View style={styles.preview}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={64} color={COLORS.goldMuted} />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            testID="cam-btn"
            style={styles.actionBtnAlt}
            onPress={() => pick(true)}
          >
            <Ionicons name="camera" size={20} color={COLORS.goldPremium} />
            <Text style={styles.actionBtnAltText}>CAMERA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="gallery-btn"
            style={styles.actionBtnAlt}
            onPress={() => pick(false)}
          >
            <Ionicons name="images" size={20} color={COLORS.goldPremium} />
            <Text style={styles.actionBtnAltText}>GALLERY</Text>
          </TouchableOpacity>
        </View>

        {imageUri && !result && (
          <TouchableOpacity
            testID="analyze-btn"
            style={styles.primary}
            onPress={scan}
            disabled={scanMeal.isPending}
          >
            {scanMeal.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryText}>ANALYZE WITH AI</Text>
            )}
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard} testID="scan-result">
            <Text style={styles.resultName}>{result.name}</Text>
            <Text style={styles.resultPortion}>{result.portion}</Text>
            <View style={styles.macroGrid}>
              <Mac label="KCAL" value={result.calories} />
              <Mac label="PROTEIN" value={`${result.protein_g}g`} />
              <Mac label="CARBS" value={`${result.carbs_g}g`} />
              <Mac label="FATS" value={`${result.fats_g}g`} />
            </View>
            {result.notes && <Text style={styles.notes}>💡 {result.notes}</Text>}
            <TouchableOpacity
              testID="log-meal-btn"
              style={styles.primary}
              onPress={onLogMeal}
              disabled={logMeal.isPending}
            >
              {logMeal.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryText}>LOG THIS MEAL</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Mac({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.macItem}>
      <Text style={styles.macLabel}>{label}</Text>
      <Text style={styles.macValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.l, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  preview: {
    aspectRatio: 1,
    borderRadius: RADIUS.xxl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: COLORS.textMuted, marginTop: 12 },
  row: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtnAlt: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.goldPremium,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnAltText: { color: COLORS.goldPremium, fontWeight: "800", letterSpacing: 1 },
  primary: {
    backgroundColor: COLORS.goldPremium,
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    marginTop: 16,
  },
  primaryText: { color: "#000", fontWeight: "800", letterSpacing: 1.5 },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.l,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  resultName: { color: "#fff", fontSize: 22, fontWeight: "800", textTransform:"capitalize" },
  resultPortion: { color: COLORS.goldMuted, fontSize: 13, letterSpacing: 1, marginTop: 4 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 8 },
  macItem: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: COLORS.surfaceElevated,
    padding: 8,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  macLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: "700" },
  macValue: { color: COLORS.goldPremium, fontSize: 18, fontWeight: "800", marginTop: 4 },
  notes: { color: COLORS.textSecondary, marginTop: 12, lineHeight: 20 },
});
