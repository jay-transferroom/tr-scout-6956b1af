import { Player } from "@/types/player";
import type { PositionPlayerSlot } from "@/hooks/useMultiPlayerPositions";
import { getClubRating } from "@/utils/clubRating";

// Same formation → position map used by SquadDepthView. Keep in sync.
const DEPTH_FORMATION_POSITIONS: Record<string, string[]> = {
  "4-3-3": ["GK", "LB", "CB1", "CB2", "RB", "CDM", "CM1", "CM2", "LW", "ST", "RW"],
  "4-2-3-1": ["GK", "LB", "CB1", "CB2", "RB", "CDM1", "CDM2", "LW", "CAM", "RW", "ST"],
  "4-4-2": ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"],
};

// Map a depth slot to the natural player position(s) we prefer for that slot.
const SLOT_TO_POSITION: Record<string, string[]> = {
  GK: ["GK"],
  LB: ["LB", "LWB"],
  RB: ["RB", "RWB"],
  CB1: ["CB"],
  CB2: ["CB"],
  CDM: ["CDM", "DM", "CM"],
  CDM1: ["CDM", "DM", "CM"],
  CDM2: ["CDM", "DM", "CM"],
  CM1: ["CM", "CAM", "CDM"],
  CM2: ["CM", "CAM", "CDM"],
  CAM: ["CAM", "CM"],
  LM: ["LM", "LW"],
  RM: ["RM", "RW"],
  LW: ["LW", "LM", "LF"],
  RW: ["RW", "RM", "RF"],
  ST: ["ST", "CF"],
  ST1: ["ST", "CF"],
  ST2: ["ST", "CF"],
};

/**
 * Build a depth configuration with 5 players per position for the given formation.
 * Prefers players whose natural position matches each slot; falls back to any
 * available club player, ranked by rating.
 */
export function buildDepthSeed(
  formation: string,
  clubPlayers: Player[],
  clubWeights?: any,
  perSlot = 5
): PositionPlayerSlot[] {
  const positions = DEPTH_FORMATION_POSITIONS[formation] ?? DEPTH_FORMATION_POSITIONS["4-3-3"];
  if (!clubPlayers.length) return [];

  const ratingOf = (p: Player) => getClubRating(p, clubWeights) ?? p.xtvScore ?? 0;
  const sorted = [...clubPlayers].sort((a, b) => (ratingOf(b) as number) - (ratingOf(a) as number));

  const used = new Set<string>();
  const slots: PositionPlayerSlot[] = [];

  const matchesNatural = (player: Player, wanted: string[]): boolean => {
    const pos = (player.positions || []).map((x) => x.toUpperCase());
    return wanted.some((w) => pos.includes(w.toUpperCase()));
  };

  for (const slot of positions) {
    const wanted = SLOT_TO_POSITION[slot] ?? [slot];
    const natural = sorted.filter((p) => !used.has(p.id) && matchesNatural(p, wanted));
    const picked: Player[] = natural.slice(0, perSlot);

    // Top up from any remaining players if not enough naturals
    if (picked.length < perSlot) {
      const filler = sorted.filter((p) => !used.has(p.id) && !picked.includes(p));
      for (const p of filler) {
        if (picked.length >= perSlot) break;
        picked.push(p);
      }
    }

    if (picked.length === 0) continue;
    picked.forEach((p) => used.add(p.id));

    slots.push({
      position: slot,
      activePlayerId: picked[0].id,
      alternatePlayerIds: picked.slice(1).map((p) => p.id),
    });
  }

  return slots;
}
