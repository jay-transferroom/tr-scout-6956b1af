import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MatchScoutingReport {
  id: string;
  match_identifier: string;
  player_id: string;
  scout_id: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a stable match identifier from fixture data.
 */
export function getMatchIdentifier(homeTeam: string, awayTeam: string, matchDate: string): string {
  const dateOnly = matchDate.split("T")[0];
  return `${homeTeam} vs ${awayTeam}|${dateOnly}`;
}

export const useMatchScoutingReports = (matchIdentifier: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = ["match-scouting-reports", matchIdentifier];

  const { data: reports = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<MatchScoutingReport[]> => {
      if (!matchIdentifier) return [];

      const { data, error } = await supabase
        .from("match_scouting_reports")
        .select("*")
        .eq("match_identifier", matchIdentifier);

      if (error) {
        console.error("Error fetching match scouting reports:", error);
        throw error;
      }

      return (data || []) as MatchScoutingReport[];
    },
    enabled: !!matchIdentifier,
  });

  const upsertReport = useMutation({
    mutationFn: async ({
      playerId,
      notes,
      rating,
    }: {
      playerId: string;
      notes: string | null;
      rating: number | null;
    }) => {
      if (!user || !matchIdentifier) throw new Error("Not authenticated or no match selected");

      const { data, error } = await supabase
        .from("match_scouting_reports")
        .upsert(
          {
            match_identifier: matchIdentifier,
            player_id: playerId,
            scout_id: user.id,
            notes,
            rating,
          },
          { onConflict: "match_identifier,player_id,scout_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error upserting match scouting report:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Helper: get the current user's report for a specific player
  const getReportForPlayer = (playerId: string): MatchScoutingReport | undefined => {
    if (!user) return undefined;
    return reports.find(
      (r) => r.player_id === playerId && r.scout_id === user.id
    );
  };

  return {
    reports,
    isLoading,
    upsertReport,
    getReportForPlayer,
  };
};
