import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { Storage } from "./storage-base";

// Keys stored in SecureStore (sensitive); everything else in AsyncStorage
const SECURE_KEYS = new Set(["fitx_token"]);

const impl: Storage = {
  async getItem<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = SECURE_KEYS.has(key)
        ? await SecureStore.getItemAsync(key)
        : await AsyncStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return fallback;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    if (SECURE_KEYS.has(key)) {
      await SecureStore.setItemAsync(key, raw);
    } else {
      await AsyncStorage.setItem(key, raw);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (SECURE_KEYS.has(key)) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export const storage = impl;
