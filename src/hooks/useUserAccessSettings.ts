import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserAccessSetting {
  id: string;
  user_id: string;
  scout_access_mode: string;
  scout_access_user_ids: string[];
  shortlist_access_mode: string;
}

export const useUserAccessSettings = () => {
  return useQuery({
    queryKey: ['user-access-settings'],
    queryFn: async (): Promise<UserAccessSetting[]> => {
      const { data, error } = await supabase
        .from('user_access_settings' as any)
        .select('*');

      if (error) throw error;
      return (data as any[]) || [];
    },
  });
};

export const useUpdateUserAccessSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      scoutAccessMode,
      scoutAccessUserIds,
      shortlistAccessMode,
    }: {
      userId: string;
      scoutAccessMode?: string;
      scoutAccessUserIds?: string[];
      shortlistAccessMode?: string;
    }) => {
      const updateData: any = { user_id: userId };
      if (scoutAccessMode !== undefined) updateData.scout_access_mode = scoutAccessMode;
      if (scoutAccessUserIds !== undefined) updateData.scout_access_user_ids = scoutAccessUserIds;
      if (shortlistAccessMode !== undefined) updateData.shortlist_access_mode = shortlistAccessMode;

      const { error } = await supabase
        .from('user_access_settings' as any)
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access-settings'] });
      toast.success('Permissions updated');
    },
    onError: (error) => {
      console.error('Error updating access settings:', error);
      toast.error('Failed to update permissions');
    },
  });
};
