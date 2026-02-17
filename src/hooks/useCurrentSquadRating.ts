import { useMemo } from "react";
import { Player } from "@/types/player";
import { useClubRatingWeights } from "@/hooks/useClubRatingWeights";
import { getClubRating } from "@/utils/clubRating";

interface PositionAssignment {
  position: string;
  player_id: string;
}

interface CurrentSquadRating {
  average_starter_rating: number;
  KeeperRating: number;
  DefenderRating: number;
  CentreBackRating: number;
  LeftBackRating: number;
  RightBackRating: number;
  MidfielderRating: number;
  CentreMidfielderRating: number;
  AttackerRating: number;
  ForwardRating: number;
  WingerRating: number;
}

const getPositionCategory = (position: string): keyof CurrentSquadRating | null => {
  const pos = position.toLowerCase();
  
  if (pos.includes('gk')) return 'KeeperRating';
  if (pos.includes('cb')) return 'CentreBackRating';
  if (pos.includes('lb') || pos.includes('lwb')) return 'LeftBackRating';
  if (pos.includes('rb') || pos.includes('rwb')) return 'RightBackRating';
  if (pos.includes('cm') || pos.includes('cdm')) return 'CentreMidfielderRating';
  if (pos.includes('lw') || pos.includes('rw') || pos.includes('lm') || pos.includes('rm')) return 'WingerRating';
  if (pos.includes('cam') || pos.includes('am')) return 'AttackerRating';
  if (pos.includes('cf') || pos.includes('st')) return 'ForwardRating';
  
  // Fallback categories
  if (pos.includes('d')) return 'DefenderRating';
  if (pos.includes('m')) return 'MidfielderRating';
  if (pos.includes('f') || pos.includes('w')) return 'AttackerRating';
  
  return null;
};

export const useCurrentSquadRating = (
  positionAssignments: PositionAssignment[],
  allPlayers: Player[]
): CurrentSquadRating | null => {
  const { data: clubRatingData } = useClubRatingWeights();
  const clubWeights = clubRatingData?.weights;

  return useMemo(() => {
    if (positionAssignments.length === 0 || allPlayers.length === 0) {
      return null;
    }

    const assignedPlayers = positionAssignments
      .map(assignment => {
        const player = allPlayers.find(p => p.id === assignment.player_id);
        return player ? { ...player, assignedPosition: assignment.position } : null;
      })
      .filter((p): p is Player & { assignedPosition: string } => p !== null);

    if (assignedPlayers.length === 0) {
      return null;
    }

    // Group players by position category
    const positionGroups: Record<string, number[]> = {
      KeeperRating: [],
      DefenderRating: [],
      CentreBackRating: [],
      LeftBackRating: [],
      RightBackRating: [],
      MidfielderRating: [],
      CentreMidfielderRating: [],
      AttackerRating: [],
      ForwardRating: [],
      WingerRating: [],
    };

    assignedPlayers.forEach(player => {
      const category = getPositionCategory(player.assignedPosition);
      const rating = getClubRating(player, clubWeights);
      if (category && rating) {
        positionGroups[category].push(rating);
        
        // Also add to broader categories
        if (category === 'CentreBackRating' || category === 'LeftBackRating' || category === 'RightBackRating') {
          positionGroups.DefenderRating.push(rating);
        }
        if (category === 'CentreMidfielderRating') {
          positionGroups.MidfielderRating.push(rating);
        }
        if (category === 'AttackerRating' || category === 'ForwardRating' || category === 'WingerRating') {
          // These are already distinct
        }
      }
    });

    // Calculate averages for each position
    const ratings: CurrentSquadRating = {
      average_starter_rating: 0,
      KeeperRating: 0,
      DefenderRating: 0,
      CentreBackRating: 0,
      LeftBackRating: 0,
      RightBackRating: 0,
      MidfielderRating: 0,
      CentreMidfielderRating: 0,
      AttackerRating: 0,
      ForwardRating: 0,
      WingerRating: 0,
    };

    Object.keys(positionGroups).forEach(key => {
      const group = positionGroups[key];
      if (group.length > 0) {
        const avg = group.reduce((sum, r) => sum + r, 0) / group.length;
        ratings[key as keyof CurrentSquadRating] = Math.round(avg * 10) / 10;
      }
    });

    // Calculate overall average from all assigned players
    const allRatings = assignedPlayers
      .map(p => getClubRating(p, clubWeights))
      .filter((r): r is number => r !== null && r !== undefined);
    
    if (allRatings.length > 0) {
      ratings.average_starter_rating = Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10;
    }

    return ratings;
  }, [positionAssignments, allPlayers, clubWeights]);
};
