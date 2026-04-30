import { useSyncExternalStore, useCallback } from "react";
import { RecommendationValue } from "@/components/RecommendationBadge";
import { getMockRecommendation, __setLiveRecommendationResolver } from "@/utils/mockRecommendations";

export interface RecommendationHistoryEntry {
  from: RecommendationValue | null;
  to: RecommendationValue | null;
  user: string;
  date: Date;
}

interface PlayerRecommendationState {
  /** The live current value, or undefined if no live action has been taken (fall through to mock). */
  value: RecommendationValue | null | undefined;
  /** Live history entries, newest first. Does NOT include seeded mock history (added at read time). */
  history: RecommendationHistoryEntry[];
  /** Attribution for the current live value. */
  attribution: { user: string; date: Date } | null;
}

// Module-level store keyed by playerId.
const store = new Map<string, PlayerRecommendationState>();
const subscribers = new Map<string, Set<() => void>>();

const getOrCreate = (playerId: string): PlayerRecommendationState => {
  let entry = store.get(playerId);
  if (!entry) {
    entry = { value: undefined, history: [], attribution: null };
    store.set(playerId, entry);
  }
  return entry;
};

const notify = (playerId: string) => {
  const subs = subscribers.get(playerId);
  if (subs) subs.forEach((cb) => cb());
};

const subscribe = (playerId: string, cb: () => void) => {
  let subs = subscribers.get(playerId);
  if (!subs) {
    subs = new Set();
    subscribers.set(playerId, subs);
  }
  subs.add(cb);
  return () => {
    subs!.delete(cb);
  };
};

/**
 * Set or clear the live recommendation for a player.
 * Records a history entry attributed to `user` at "now".
 */
export const setPlayerRecommendation = (
  playerId: string,
  next: RecommendationValue | null,
  user: string
) => {
  const current = getOrCreate(playerId);
  // Use the currently displayed value (live or mock) as the "from".
  const from =
    current.value !== undefined ? current.value : getMockRecommendation(playerId);
  const date = new Date();
  const newState: PlayerRecommendationState = {
    value: next,
    attribution: next ? { user, date } : null,
    history: [{ from, to: next, user, date }, ...current.history],
  };
  store.set(playerId, newState);
  notify(playerId);
};

/**
 * Read the effective recommendation for a player (live → mock fallback).
 * Pure read used outside React (e.g. sorting helpers can adopt this).
 */
export const readPlayerRecommendation = (playerId: string): RecommendationValue | null => {
  const entry = store.get(playerId);
  if (entry && entry.value !== undefined) return entry.value;
  return getMockRecommendation(playerId);
};

// Wire sort helpers (in mockRecommendations.ts) to read the live store.
__setLiveRecommendationResolver(readPlayerRecommendation);

interface UsePlayerRecommendationsResult {
  /** Effective value (live if set, otherwise mock fallback). */
  value: RecommendationValue | null;
  /** True if the value comes from a live user action (not the mock fallback). */
  isLive: boolean;
  /** Attribution for live value, or null when falling through to mock. */
  attribution: { user: string; date: Date } | null;
  /** Live history entries (newest first). Does not include seeded mock history. */
  liveHistory: RecommendationHistoryEntry[];
  /** Set or clear the recommendation, attributed to `user`. */
  setValue: (next: RecommendationValue | null, user: string) => void;
}

/**
 * Subscribe to the recommendation state for a player.
 *
 * Two-tier lookup: returns live value when present, else mock fallback so demo
 * surfaces stay visually rich.
 */
export const usePlayerRecommendations = (playerId: string): UsePlayerRecommendationsResult => {
  const subscribeFn = useCallback((cb: () => void) => subscribe(playerId, cb), [playerId]);
  const getSnapshot = useCallback(() => {
    // Returning the same Map entry reference keeps useSyncExternalStore stable
    // across renders when nothing changed.
    return store.get(playerId);
  }, [playerId]);

  const entry = useSyncExternalStore(subscribeFn, getSnapshot, getSnapshot);

  const liveValue = entry?.value;
  const value = liveValue !== undefined ? liveValue : getMockRecommendation(playerId);
  const isLive = liveValue !== undefined;

  const setValue = useCallback(
    (next: RecommendationValue | null, user: string) => {
      setPlayerRecommendation(playerId, next, user);
    },
    [playerId]
  );

  return {
    value,
    isLive,
    attribution: entry?.attribution ?? null,
    liveHistory: entry?.history ?? [],
    setValue,
  };
};
