import { CategoryWeights, PositionKey, computeMyRating } from "@/data/myRatingWeights";

/**
 * Maps a player's primary position string to the appropriate PositionKey
 * for looking up club rating weights.
 */
export function getPositionKey(position: string | undefined): PositionKey {
  if (!position) return 'CM'; // fallback
  const pos = position.toUpperCase();

  if (pos.includes('GK')) return 'GK';
  if (pos === 'CB' || pos === 'DC') return 'CB';
  if (pos === 'RB' || pos === 'RWB') return 'RB';
  if (pos === 'LB' || pos === 'LWB') return 'LB';
  if (pos === 'CDM' || pos === 'DM') return 'DM';
  if (pos === 'CM') return 'CM';
  if (pos === 'CAM' || pos === 'AM') return 'AM';
  if (pos === 'LW' || pos === 'RW' || pos === 'LM' || pos === 'RM') return 'W';
  if (pos === 'ST' || pos === 'CF' || pos === 'SS') return 'F';

  // Broader fallbacks
  if (pos.includes('W') || pos.includes('LM') || pos.includes('RM')) return 'W';
  if (pos.includes('AM') || pos.includes('CAM')) return 'AM';
  if (pos.includes('DM') || pos.includes('CDM')) return 'DM';
  if (pos.includes('CM') || pos.includes('M')) return 'CM';
  if (pos.includes('CB') || pos.includes('D')) return 'CB';
  if (pos.includes('ST') || pos.includes('CF') || pos.includes('F')) return 'F';

  return 'CM';
}

/**
 * Compute the Club Rating for a player using the stored club weights.
 * Falls back to transferroomRating if weights are unavailable.
 *
 * @param player - Must have transferroomRating, futureRating, age, and positions
 * @param allWeights - The full position-keyed weights from useClubRatingWeights
 * @returns The computed club rating number, or the raw transferroomRating, or null
 */
export function getClubRating(
  player: {
    transferroomRating?: number | null;
    futureRating?: number | null;
    age?: number;
    positions?: string[];
  },
  allWeights: Record<PositionKey, CategoryWeights[]> | undefined | null
): number | null {
  if (!allWeights) {
    return player.transferroomRating ?? null;
  }

  const posKey = getPositionKey(player.positions?.[0]);
  const weights = allWeights[posKey];
  if (!weights || weights.length === 0) {
    return player.transferroomRating ?? null;
  }

  return computeMyRating(player, weights);
}

/**
 * Format a rating for display (e.g. "72.5" or "N/A").
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return 'N/A';
  return rating.toFixed(1);
}
