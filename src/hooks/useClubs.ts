
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTeamLogoUrl } from "@/utils/teamLogos";

interface Club {
  id: string;
  name: string;
  slug: string;
  badge_url: string | null;
  badge_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async (): Promise<Club[]> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clubs:', error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useUpdateUserClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, clubId }: { userId: string; clubId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ club_id: clubId })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
