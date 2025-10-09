import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SquadAverageRating {
  Squad: string;
  competition: string;
  competitionid: number;
  squadid: number;
  IsChelsea: string;
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

export const useSquadAverageRatings = (competition?: string) => {
  return useQuery({
    queryKey: ['squad-average-ratings', competition],
    queryFn: async () => {
      let query = supabase
        .from('squad_average_starter-rating')
        .select('*')
        .order('average_starter_rating', { ascending: false });

      if (competition) {
        query = query.eq('competition', competition);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SquadAverageRating[];
    },
  });
};
