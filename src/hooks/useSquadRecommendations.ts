import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SquadRecommendation {
  Position: string;
  Reason: string;
}

export const useSquadRecommendations = () => {
  return useQuery({
    queryKey: ['squad-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squad_recommendations')
        .select('*');

      if (error) throw error;
      return data as SquadRecommendation[];
    },
  });
};
