import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlayerPositionAssignment {
  id: string;
  club_name: string;
  position: string;
  player_id: string;
  formation: string;
  squad_type: string;
  assigned_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export const usePlayerPositionAssignments = (clubName: string, formation: string, squadType: string) => {
  return useQuery({
    queryKey: ['player-position-assignments', clubName, formation, squadType],
    queryFn: async (): Promise<PlayerPositionAssignment[]> => {
      const { data, error } = await supabase
        .from('player_position_assignments')
        .select('*')
        .eq('club_name', clubName)
        .eq('formation', formation)
        .eq('squad_type', squadType);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAllPlayerPositionAssignments = (clubName: string, formation: string) => {
  return useQuery({
    queryKey: ['all-player-position-assignments', clubName, formation],
    queryFn: async (): Promise<PlayerPositionAssignment[]> => {
      const { data, error } = await supabase
        .from('player_position_assignments')
        .select('*')
        .eq('club_name', clubName)
        .eq('formation', formation);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdatePlayerPositionAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (assignment: {
      club_name: string;
      position: string;
      player_id: string;
      formation: string;
      squad_type: string;
    }) => {
      console.log('Updating player position assignment:', assignment);
      
      const { data, error } = await supabase
        .from('player_position_assignments')
        .upsert({
          ...assignment,
          assigned_by_user_id: (await supabase.auth.getUser()).data.user?.id
        }, { 
          onConflict: 'club_name,position,formation,squad_type' 
        })
        .select()
        .single();
      
      console.log('Assignment update result:', { data, error });
      
      if (error) {
        console.error('Assignment update error:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      console.log('Assignment update successful, invalidating queries');
      queryClient.invalidateQueries({ 
        queryKey: ['player-position-assignments', variables.club_name, variables.formation, variables.squad_type] 
      });
      // Also invalidate all assignments query for shadow squad filtering
      queryClient.invalidateQueries({ 
        queryKey: ['all-player-position-assignments', variables.club_name, variables.formation] 
      });
      
      toast({
        title: "Player Assignment Updated",
        description: `Player has been assigned to ${variables.position} position.`,
      });
    },
    onError: (error) => {
      console.error('Assignment mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to update player assignment. Please try again.",
        variant: "destructive",
      });
    }
  });
};

export const useClearAllPositionAssignments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: {
      club_name: string;
      formation: string;
      squad_type: string;
    }) => {
      const { error } = await supabase
        .from('player_position_assignments')
        .delete()
        .eq('club_name', params.club_name)
        .eq('formation', params.formation)
        .eq('squad_type', params.squad_type);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['player-position-assignments', variables.club_name, variables.formation, variables.squad_type] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['all-player-position-assignments', variables.club_name, variables.formation] 
      });
      
      toast({
        title: "Squad Cleared",
        description: "All player assignments have been cleared. You can now start a fresh squad configuration.",
      });
    },
    onError: (error) => {
      console.error('Clear assignments error:', error);
      toast({
        title: "Error",
        description: "Failed to clear squad. Please try again.",
        variant: "destructive",
      });
    }
  });
};

export const useRemovePlayerPositionAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: {
      club_name: string;
      position: string;
      formation: string;
      squad_type: string;
    }) => {
      const { error } = await supabase
        .from('player_position_assignments')
        .delete()
        .eq('club_name', params.club_name)
        .eq('position', params.position)
        .eq('formation', params.formation)
        .eq('squad_type', params.squad_type);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['player-position-assignments', variables.club_name, variables.formation, variables.squad_type] 
      });
      // Also invalidate all assignments query
      queryClient.invalidateQueries({ 
        queryKey: ['all-player-position-assignments', variables.club_name, variables.formation] 
      });
      
      toast({
        title: "Player Assignment Removed",
        description: `Player has been removed from ${variables.position} position.`,
      });
    },
    onError: (error) => {
      console.error('Remove assignment error:', error);
      toast({
        title: "Error",
        description: "Failed to remove player assignment. Please try again.",
        variant: "destructive",
      });
    }
  });
};