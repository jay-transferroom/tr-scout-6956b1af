import { useSyncExternalStore, useCallback } from "react";

/**
 * Player Tags — club-configurable labels users can attach to any player
 * (e.g. "Youth Prospect", "Poor temperament").
 *
 * Backed by localStorage so the demo works without a backend round-trip,
 * mirroring the pattern used for Recommendations.
 *
 *  - Tag definitions   → `club-settings.playerTags`        (PlayerTag[])
 *  - Tag assignments   → `club-settings.playerTagAssignments`
 *                        (Record<playerId, string[]> — tag ids)
 *
 * Players that have no live assignment fall back to a deterministic mock
 * derived from their id so demo surfaces stay visually rich.
 */

export interface PlayerTag {
  id: string;
  label: string;
  color: string; // hex e.g. "#22C55E"
}

const DEFS_KEY = "club-settings.playerTags";
const ASSIGN_KEY = "club-settings.playerTagAssignments";
const DEFS_EVENT = "player-tags-defs-changed";
const ASSIGN_EVENT = "player-tags-assignments-changed";

export const DEFAULT_PLAYER_TAGS: PlayerTag[] = [
  { id: "tag-youth-prospect", label: "Youth Prospect", color: "#22C55E" },
  { id: "tag-high-potential", label: "High Potential", color: "#3B82F6" },
  { id: "tag-loan-target", label: "Loan Target", color: "#8B5CF6" },
  { id: "tag-poor-temperament", label: "Poor Temperament", color: "#EF4444" },
];

// ----------------- Definitions store -----------------

const readDefs = (): PlayerTag[] => {
  if (typeof window === "undefined") return DEFAULT_PLAYER_TAGS;
  const raw = window.localStorage.getItem(DEFS_KEY);
  if (!raw) return DEFAULT_PLAYER_TAGS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return DEFAULT_PLAYER_TAGS;
};

export const setPlayerTagDefinitions = (tags: PlayerTag[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEFS_KEY, JSON.stringify(tags));
  window.dispatchEvent(new CustomEvent(DEFS_EVENT));
};

let cachedDefs: PlayerTag[] | null = null;
const getDefsSnapshot = (): PlayerTag[] => {
  if (cachedDefs === null) cachedDefs = readDefs();
  return cachedDefs;
};
const subscribeDefs = (cb: () => void) => {
  const handler = () => {
    cachedDefs = readDefs();
    cb();
  };
  window.addEventListener(DEFS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DEFS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};

export const usePlayerTagDefinitions = (): PlayerTag[] => {
  return useSyncExternalStore(subscribeDefs, getDefsSnapshot, getDefsSnapshot);
};

// ----------------- Assignments store -----------------

const readAssignments = (): Record<string, string[]> => {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(ASSIGN_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* fall through */
  }
  return {};
};

const writeAssignments = (next: Record<string, string[]>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(ASSIGN_EVENT));
};

let cachedAssignments: Record<string, string[]> | null = null;
const getAssignmentsSnapshot = (): Record<string, string[]> => {
  if (cachedAssignments === null) cachedAssignments = readAssignments();
  return cachedAssignments;
};
const subscribeAssignments = (cb: () => void) => {
  const handler = () => {
    cachedAssignments = readAssignments();
    cb();
  };
  window.addEventListener(ASSIGN_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(ASSIGN_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};

export const setPlayerTagsForPlayer = (playerId: string, tagIds: string[]) => {
  const current = readAssignments();
  const next = { ...current, [playerId]: tagIds };
  writeAssignments(next);
};

// ----------------- Mock fallback -----------------

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * Stable mock: ~55% of players get 1 tag, ~15% get 2 tags, rest get none.
 * Picks deterministically from the current tag definitions.
 */
const getMockTagIds = (playerId: string, defs: PlayerTag[]): string[] => {
  if (defs.length === 0) return [];
  const h = hash(playerId);
  const bucket = h % 20;
  if (bucket < 6) return []; // 30% no tags
  const first = defs[h % defs.length].id;
  if (bucket < 17) return [first]; // ~55% one tag
  const secondIdx = (Math.floor(h / 7) % defs.length);
  const second = defs[secondIdx].id;
  return second === first ? [first] : [first, second];
};

// ----------------- Public hook -----------------

export interface UsePlayerTagsResult {
  /** All currently configured tag definitions. */
  definitions: PlayerTag[];
  /** Resolved tag objects assigned to this player (live → mock fallback). */
  tags: PlayerTag[];
  /** True when the assignment came from a live user action. */
  isLive: boolean;
  /** Replace this player's tag assignment with `tagIds`. */
  setTags: (tagIds: string[]) => void;
}

export const usePlayerTags = (playerId: string): UsePlayerTagsResult => {
  const defs = useSyncExternalStore(subscribeDefs, getDefsSnapshot, getDefsSnapshot);
  const assignments = useSyncExternalStore(
    subscribeAssignments,
    getAssignmentsSnapshot,
    getAssignmentsSnapshot
  );

  const live = assignments[playerId];
  const isLive = Array.isArray(live);
  const tagIds = isLive ? live! : getMockTagIds(playerId, defs);
  const tags = tagIds
    .map((id) => defs.find((d) => d.id === id))
    .filter((t): t is PlayerTag => Boolean(t));

  const setTags = useCallback(
    (next: string[]) => setPlayerTagsForPlayer(playerId, next),
    [playerId]
  );

  return { definitions: defs, tags, isLive, setTags };
};

/** Non-hook reader for sort/filter helpers. */
export const readPlayerTags = (playerId: string): PlayerTag[] => {
  const defs = getDefsSnapshot();
  const assignments = getAssignmentsSnapshot();
  const live = assignments[playerId];
  const tagIds = Array.isArray(live) ? live : getMockTagIds(playerId, defs);
  return tagIds
    .map((id) => defs.find((d) => d.id === id))
    .filter((t): t is PlayerTag => Boolean(t));
};
