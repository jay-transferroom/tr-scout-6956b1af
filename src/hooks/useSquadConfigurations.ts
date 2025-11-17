import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SquadConfiguration {
  id: string;
  club_name: string;
  name: string;
  formation: string;
  squad_type: string;
  position_assignments: Array<{
    position: string;
    player_id: string;
  }>;
  description?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export const useSquadConfigurations = (clubName: string) => {
  return useQuery({
    queryKey: ['squad-configurations', clubName],
    queryFn: async (): Promise<SquadConfiguration[]> => {
      const { data, error } = await supabase
        .from('squad_configurations')
        .select('*')
        .eq('club_name', clubName)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to ensure position_assignments is properly typed
      return (data || []).map(config => ({
        ...config,
        position_assignments: config.position_assignments as Array<{
          position: string;
          player_id: string;
        }>
      }));
    },
  });
};

export const useSaveSquadConfiguration = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (config: Omit<SquadConfiguration, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('squad_configurations')
        .insert({
          ...config,
          created_by_user_id: user.id,
          position_assignments: config.position_assignments,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['squad-configurations', variables.club_name] });
    },
  });
};

export const useUpdateSquadConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...config }: Partial<SquadConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from('squad_configurations')
        .update({
          name: config.name,
          formation: config.formation,
          squad_type: config.squad_type,
          position_assignments: config.position_assignments,
          description: config.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['squad-configurations', data.club_name] });
    },
  });
};

export const useDeleteSquadConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clubName }: { id: string; clubName: string }) => {
      const { error } = await supabase
        .from('squad_configurations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clubName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['squad-configurations', data.clubName] });
    },
  });
};
