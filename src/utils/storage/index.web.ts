import type { Storage } from "./storage-base";

const impl: Storage = {
  async getItem<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
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
    localStorage.setItem(key, raw);
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

export const storage = impl;
