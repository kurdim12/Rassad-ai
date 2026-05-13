// localStorage helpers for API key + history.

import { CheckResult } from "./api";

const K_KEY = "rasad.gemini_key";
const K_HIST = "rasad.history.v1";
const K_THEME = "rasad.theme";
const K_ONBOARDED = "rasad.onboarded.v1";

export const getApiKey = (): string =>
  (typeof localStorage !== "undefined" && localStorage.getItem(K_KEY)) || "";

export const setApiKey = (key: string) => {
  if (key) localStorage.setItem(K_KEY, key);
  else localStorage.removeItem(K_KEY);
};

export interface HistoryItem {
  id: string;
  claim: string;
  verdict: CheckResult["verdict"];
  confidence: number;
  at: number;
  result: CheckResult;
}

export const getHistory = (): HistoryItem[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(K_HIST) || "[]");
  } catch {
    return [];
  }
};

export const pushHistory = (item: HistoryItem): HistoryItem[] => {
  const existing = getHistory().filter((h) => h.id !== item.id);
  const next = [item, ...existing].slice(0, 20);
  localStorage.setItem(K_HIST, JSON.stringify(next));
  return next;
};

export const removeHistory = (id: string): HistoryItem[] => {
  const next = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(K_HIST, JSON.stringify(next));
  return next;
};

export const clearHistory = () => localStorage.removeItem(K_HIST);

export const getTheme = (): "dark" | "light" =>
  ((typeof localStorage !== "undefined" && localStorage.getItem(K_THEME)) as
    | "dark"
    | "light") || "dark";

export const setTheme = (t: "dark" | "light") => {
  localStorage.setItem(K_THEME, t);
  document.documentElement.classList.toggle("light", t === "light");
};

export const isOnboarded = (): boolean => !!localStorage.getItem(K_ONBOARDED);
export const markOnboarded = () => localStorage.setItem(K_ONBOARDED, "1");
