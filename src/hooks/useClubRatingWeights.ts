import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CategoryWeights,
  PositionKey,
  DEFAULT_POSITION_WEIGHTS,
  clonePositionWeights,
} from "@/data/myRatingWeights";

const CLUB_NAME = "Chelsea";

interface ClubRatingWeightsRow {
  id: string;
  club_name: string;
  weights: Record<PositionKey, CategoryWeights[]>;
  league_adjustments: boolean;
  created_at: string;
  updated_at: string;
  updated_by_user_id: string | null;
}

export const useClubRatingWeights = () => {
  return useQuery({
    queryKey: ["club-rating-weights", CLUB_NAME],
    queryFn: async (): Promise<{
      weights: Record<PositionKey, CategoryWeights[]>;
      leagueAdjustments: boolean;
    }> => {
      const { data, error } = await supabase
        .from("club_rating_weights" as any)
        .select("*")
        .eq("club_name", CLUB_NAME)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const row = data as unknown as ClubRatingWeightsRow;
        return {
          weights: row.weights,
          leagueAdjustments: row.league_adjustments,
        };
      }

      return {
        weights: clonePositionWeights(DEFAULT_POSITION_WEIGHTS),
        leagueAdjustments: true,
      };
    },
  });
};

export const useSaveClubRatingWeights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      weights,
      leagueAdjustments,
    }: {
      weights: Record<PositionKey, CategoryWeights[]>;
      leagueAdjustments: boolean;
    }) => {
      const { data, error } = await supabase
        .from("club_rating_weights" as any)
        .upsert(
          {
            club_name: CLUB_NAME,
            weights: weights as any,
            league_adjustments: leagueAdjustments,
          },
          { onConflict: "club_name" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-rating-weights"] });
    },
  });
};
