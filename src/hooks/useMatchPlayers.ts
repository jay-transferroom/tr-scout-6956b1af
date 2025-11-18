import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/player";

export interface MatchPlayer extends Player {
  minutesPlayed?: number;
  positionPlayed?: string;
  goals?: number;
  assists?: number;
  matchRating?: number;
}

export const useMatchPlayers = (fixtureId?: string) => {
  return useQuery({
    queryKey: ['match-players', fixtureId],
    queryFn: async (): Promise<{ homeTeam: MatchPlayer[]; awayTeam: MatchPlayer[] }> => {
      if (!fixtureId) {
        return { homeTeam: [], awayTeam: [] };
      }

      const { data, error } = await supabase
        .from('player_fixtures')
        .select(`
          minutes_played,
          position_played,
          goals,
          assists,
          rating,
          player:players(
            id,
            name,
            club,
            age,
            positions,
            nationality,
            date_of_birth,
            dominant_foot,
            contract_status,
            image_url,
            transferroom_rating
          )
        `)
        .eq('fixture_id', fixtureId)
        .gt('minutes_played', 0);

      if (error) {
        console.error('Error fetching match players:', error);
        throw error;
      }

      // Transform players data
      const players = (data || []).map(pf => {
        const player = pf.player;
        if (!player) return null;
        
        return {
          id: player.id,
          name: player.name,
          club: player.club || 'Unknown',
          age: player.age || 0,
          positions: player.positions || [],
          nationality: player.nationality || 'Unknown',
          region: 'Unknown',
          dateOfBirth: player.date_of_birth || '',
          dominantFoot: player.dominant_foot || 'Unknown',
          contractStatus: player.contract_status || 'Under Contract',
          image: player.image_url,
          transferroomRating: player.transferroom_rating,
          minutesPlayed: pf.minutes_played || undefined,
          positionPlayed: pf.position_played || undefined,
          goals: pf.goals || undefined,
          assists: pf.assists || undefined,
          matchRating: pf.rating || undefined,
        } as MatchPlayer;
      }).filter(Boolean) as MatchPlayer[];

      // For now, return empty arrays as we need fixture team data to split players
      return { homeTeam: [], awayTeam: [] };
    },
    enabled: !!fixtureId,
  });
};
