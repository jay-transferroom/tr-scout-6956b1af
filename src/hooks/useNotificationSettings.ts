import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSettings } from "@/types/notification";

export const useNotificationSettings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async (): Promise<NotificationSettings | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If settings don't exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('notification_settings')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          return {
            scout_management: newSettings.scout_management,
            status_update: newSettings.status_update,
            player_tracking: newSettings.player_tracking,
            xtv_change: newSettings.xtv_change,
            injury: newSettings.injury,
            transfer: newSettings.transfer,
            availability: newSettings.availability,
            market_tracking: newSettings.market_tracking,
            comparable_players: newSettings.comparable_players,
            players_of_interest: newSettings.players_of_interest,
            questions: newSettings.questions,
            chatbot: newSettings.chatbot,
          };
        }
        throw error;
      }
      
      return {
        scout_management: data.scout_management,
        status_update: data.status_update,
        player_tracking: data.player_tracking,
        xtv_change: data.xtv_change,
        injury: data.injury,
        transfer: data.transfer,
        availability: data.availability,
        market_tracking: data.market_tracking,
        comparable_players: data.comparable_players,
        players_of_interest: data.players_of_interest,
        questions: data.questions,
        chatbot: data.chatbot,
      };
    },
    enabled: !!user?.id,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notification_settings')
        .update(settings)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
  });
};
