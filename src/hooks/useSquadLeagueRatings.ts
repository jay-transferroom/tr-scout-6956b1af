import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SquadLeagueRating {
  competition: string;
  competitionid: number;
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

export const useSquadLeagueRatings = () => {
  return useQuery({
    queryKey: ['squad-league-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squad_league_ratings')
        .select('*')
        .order('average_starter_rating', { ascending: false });

      if (error) throw error;
      return data as SquadLeagueRating[];
    },
  });
};
