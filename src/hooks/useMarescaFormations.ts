import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MarescaFormation {
  formation: string | null;
  games: number | null;
}

export const useMarescaFormations = () => {
  return useQuery({
    queryKey: ['maresca-formations'],
    queryFn: async (): Promise<MarescaFormation[]> => {
      const { data, error } = await supabase
        .from('squad_maresca_formation' as any)
        .select('formation, games')
        .order('games', { ascending: false });
      
      if (error) throw error;
      return (data as unknown) as MarescaFormation[];
    },
  });
};
