import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatchReportConfig, MatchReportRating, createDefaultMatchReportConfig } from "@/components/club-settings/MatchReportConfigTab";

const CLUB_NAME = "Chelsea";

export const useMatchReportConfig = () => {
  return useQuery({
    queryKey: ['match-report-config', CLUB_NAME],
    queryFn: async (): Promise<MatchReportConfig> => {
      const { data, error } = await supabase
        .from('match_report_config')
        .select('*')
        .eq('club_name', CLUB_NAME)
        .maybeSingle();

      if (error) throw error;
      if (!data) return createDefaultMatchReportConfig();

      return {
        ratings: (data.ratings as unknown as MatchReportRating[]) || [],
      };
    },
  });
};

export const useSaveMatchReportConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: MatchReportConfig) => {
      const { data, error } = await supabase
        .from('match_report_config')
        .upsert(
          {
            club_name: CLUB_NAME,
            ratings: config.ratings as unknown as Record<string, unknown>[],
          },
          { onConflict: 'club_name' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-report-config', CLUB_NAME] });
    },
  });
};
