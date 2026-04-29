import { RecommendationValue } from "@/components/RecommendationBadge";

// Mirrors the defaults configured in club-settings/RecommendationsTab.
// Order here defines the canonical sort order (best → worst).
export const RECOMMENDATION_OPTIONS: RecommendationValue[] = [
  { label: "Sign", colour: "#22C55E" },
  { label: "Monitor", colour: "#EAB308" },
  { label: "Pass", colour: "#EF4444" },
];

const RECOMMENDATION_ORDER: Record<string, number> = RECOMMENDATION_OPTIONS.reduce(
  (acc, opt, idx) => {
    acc[opt.label] = idx;
    return acc;
  },
  {} as Record<string, number>
);

/** Stable mock: ~70% of players have a recommendation, distributed across the options. */
export const getMockRecommendation = (playerId: string): RecommendationValue | null => {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 10;
  if (bucket >= 7) return null; // 30% unset
  return RECOMMENDATION_OPTIONS[bucket % RECOMMENDATION_OPTIONS.length];
};

/** Returns sort rank; players without a recommendation always sort to the bottom. */
export const getRecommendationRank = (playerId: string): number => {
  const rec = getMockRecommendation(playerId);
  if (!rec) return Number.POSITIVE_INFINITY;
  return RECOMMENDATION_ORDER[rec.label] ?? Number.POSITIVE_INFINITY;
};
