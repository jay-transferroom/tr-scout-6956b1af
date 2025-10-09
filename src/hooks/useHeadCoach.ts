import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HeadCoach {
  staffid: number;
  shortname: string | null;
  Image: string | null;
  current_squad: string | null;
  current_Role: string | null;
  age: number | null;
  rating: number | null;
  Style: string | null;
  "Favourite Formation": string | null;
  TrustInYouth: number | null;
  CurrentSquadId: number | null;
}

export const useHeadCoach = (clubName: string) => {
  return useQuery({
    queryKey: ['head-coach', clubName],
    queryFn: async (): Promise<HeadCoach | null> => {
      const { data, error } = await supabase
        .from('squad_coaches' as any)
        .select('*')
        .eq('current_squad', clubName)
        .maybeSingle();
      
      if (error) throw error;
      return (data as unknown) as HeadCoach | null;
    },
  });
};
