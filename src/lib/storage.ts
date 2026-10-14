import type { HardFilters, MatchHistory, Weights } from "../types";

const HISTORY_KEY = "vibe-meet-history";

export function loadHistory(): MatchHistory[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as MatchHistory[];
  } catch {
    return [];
  }
}

export function saveHistory(filters: HardFilters, weights: Weights, topFive: MatchHistory["topFive"]) {
  const next: MatchHistory = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    filters,
    weights,
    topFive,
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([next, ...loadHistory()].slice(0, 12)));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
