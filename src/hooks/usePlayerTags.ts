import { useSyncExternalStore, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Player Tags — club-configurable labels users can attach to any player
 * (e.g. "Youth Prospect", "Poor temperament").
 *
 * Backed by localStorage so the demo works without a backend round-trip,
 * mirroring the pattern used for Recommendations.
 *
 *  - Tag definitions   → `club-settings.playerTags`        (PlayerTag[])
 *  - Tag assignments   → `club-settings.playerTagAssignments`
 *                        (Record<playerId, TagAssignment[]>)
 *
 * Players that have no live assignment fall back to a deterministic mock
 * derived from their id so demo surfaces stay visually rich.
 */

export interface PlayerTag {
  id: string;
  label: string;
  color: string; // hex e.g. "#22C55E"
}

export interface TagAssignment {
  tagId: string;
  taggedBy: string;
  taggedAt: string; // ISO date string
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

const MOCK_TAGGERS = [
  "Alex Morgan",
  "Jordan Lee",
  "Casey Taylor",
  "Riley Johnson",
  "Morgan Davis",
  "Sam Wilson",
  "Chris Brown",
  "Patricia Miller",
  "Drew Thompson",
  "Quinn Anderson",
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

const readAssignments = (): Record<string, TagAssignment[]> => {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(ASSIGN_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    // Migrate old format Record<string, string[]> → new format
    const migrated: Record<string, TagAssignment[]> = {};
    for (const [playerId, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      if (value.length === 0) {
        migrated[playerId] = [];
      } else if (typeof value[0] === "string") {
        migrated[playerId] = (value as string[]).map((tagId) => ({
          tagId,
          taggedBy: "System",
          taggedAt: new Date().toISOString(),
        }));
      } else {
        migrated[playerId] = value as TagAssignment[];
      }
    }
    return migrated;
  } catch {
    return {};
  }
};

const writeAssignments = (next: Record<string, TagAssignment[]>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(ASSIGN_EVENT));
};

let cachedAssignments: Record<string, TagAssignment[]> | null = null;
const getAssignmentsSnapshot = (): Record<string, TagAssignment[]> => {
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

export const setPlayerTagsForPlayer = (
  playerId: string,
  tagIds: string[],
  taggedBy?: string
) => {
  const current = readAssignments();
  const nextAssignments: TagAssignment[] = tagIds.map((tagId) => ({
    tagId,
    taggedBy: taggedBy || "Unknown",
    taggedAt: new Date().toISOString(),
  }));
  const next = { ...current, [playerId]: nextAssignments };
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
const getMockTagAssignments = (
  playerId: string,
  defs: PlayerTag[]
): TagAssignment[] => {
  if (defs.length === 0) return [];
  const h = hash(playerId);
  const bucket = h % 20;
  if (bucket < 6) return []; // 30% no tags

  const daysAgo = 1 + (h % 90);
  const taggedAt = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000
  ).toISOString();
  const taggedBy = MOCK_TAGGERS[h % MOCK_TAGGERS.length];

  const first = defs[h % defs.length].id;
  if (bucket < 17) {
    return [{ tagId: first, taggedBy, taggedAt }];
  }

  const secondIdx = Math.floor(h / 7) % defs.length;
  const second = defs[secondIdx].id;
  if (second === first) {
    return [{ tagId: first, taggedBy, taggedAt }];
  }

  const secondTagger = MOCK_TAGGERS[(h + 3) % MOCK_TAGGERS.length];
  const secondDate = new Date(
    Date.now() - (daysAgo + 5) * 24 * 60 * 60 * 1000
  ).toISOString();
  return [
    { tagId: first, taggedBy, taggedAt },
    { tagId: second, taggedBy: secondTagger, taggedAt: secondDate },
  ];
};

// ----------------- Public hook -----------------

export interface UsePlayerTagsResult {
  /** All currently configured tag definitions. */
  definitions: PlayerTag[];
  /** Resolved tag objects assigned to this player (live → mock fallback). */
  tags: PlayerTag[];
  /** Raw tag assignments with metadata for this player. */
  tagAssignments: TagAssignment[];
  /** True when the assignment came from a live user action. */
  isLive: boolean;
  /** Replace this player's tag assignment with `tagIds`. */
  setTags: (tagIds: string[]) => void;
}

export const usePlayerTags = (playerId: string): UsePlayerTagsResult => {
  const { profile } = useAuth();
  const defs = useSyncExternalStore(subscribeDefs, getDefsSnapshot, getDefsSnapshot);
  const assignments = useSyncExternalStore(
    subscribeAssignments,
    getAssignmentsSnapshot,
    getAssignmentsSnapshot
  );

  const live = assignments[playerId];
  const isLive = Array.isArray(live);
  const tagAssignments = isLive
    ? live!
    : getMockTagAssignments(playerId, defs);
  const tags = tagAssignments
    .map((a) => defs.find((d) => d.id === a.tagId))
    .filter((t): t is PlayerTag => Boolean(t));

  const setTags = useCallback(
    (next: string[]) => {
      const userName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          profile.email
        : undefined;
      setPlayerTagsForPlayer(playerId, next, userName);
    },
    [playerId, profile]
  );

  return { definitions: defs, tags, tagAssignments, isLive, setTags };
};

/** Non-hook reader for sort/filter helpers. */
export const readPlayerTags = (playerId: string): PlayerTag[] => {
  const defs = getDefsSnapshot();
  const assignments = getAssignmentsSnapshot();
  const live = assignments[playerId];
  const tagAssignments = Array.isArray(live)
    ? live
    : getMockTagAssignments(playerId, defs);
  return tagAssignments
    .map((a) => defs.find((d) => d.id === a.tagId))
    .filter((t): t is PlayerTag => Boolean(t));
};

/** Return how many players (live assignments only) have each tag id. */
export const getTagPlayerCounts = (): Record<string, number> => {
  const assignments = getAssignmentsSnapshot();
  const counts: Record<string, number> = {};
  for (const tagAssignments of Object.values(assignments)) {
    for (const a of tagAssignments) {
      counts[a.tagId] = (counts[a.tagId] || 0) + 1;
    }
  }
  return counts;
};
