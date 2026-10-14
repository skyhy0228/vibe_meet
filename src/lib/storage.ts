import type { HardFilters, MatchHistory, Weights } from "../types";

const historyKey = (accountId?: string) => `vibe-meet-history${accountId ? `-${accountId}` : ""}`;

export function loadHistory(accountId?: string): MatchHistory[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey(accountId)) || "[]") as MatchHistory[];
  } catch {
    return [];
  }
}

export function saveHistory(accountId: string | undefined, filters: HardFilters, weights: Weights, topFive: MatchHistory["topFive"]) {
  const next: MatchHistory = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    filters,
    weights,
    topFive,
  };
  localStorage.setItem(historyKey(accountId), JSON.stringify([next, ...loadHistory(accountId)].slice(0, 12)));
  return next;
}

export function clearHistory(accountId?: string) {
  localStorage.removeItem(historyKey(accountId));
}
