import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MatchScoutingReportWithDetails {
  id: string;
  match_identifier: string;
  player_id: string;
  scout_id: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  scout_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface GroupedMatchReport {
  match_identifier: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  reports: MatchScoutingReportWithDetails[];
  totalRatings: number;
  averageRating: number | null;
}

export const useAllMatchScoutingReports = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["all-match-scouting-reports", user?.id],
    queryFn: async (): Promise<GroupedMatchReport[]> => {
      let query = supabase
        .from("match_scouting_reports")
        .select("*")
        .order("updated_at", { ascending: false });

      // Scouts only see their own reports
      if (profile?.role === "scout") {
        query = query.eq("scout_id", user!.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching all match scouting reports:", error);
        throw error;
      }

      // Fetch scout profiles for all unique scout IDs
      const scoutIds = [...new Set((data || []).map((r) => r.scout_id))];
      const scoutProfiles = new Map<string, { first_name: string | null; last_name: string | null }>();

      if (scoutIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", scoutIds);

        (profiles || []).forEach((p) => {
          scoutProfiles.set(p.id, { first_name: p.first_name, last_name: p.last_name });
        });
      }

      // Group by match_identifier
      const grouped = new Map<string, MatchScoutingReportWithDetails[]>();
      for (const report of data || []) {
        const enriched: MatchScoutingReportWithDetails = {
          ...report,
          scout_profile: scoutProfiles.get(report.scout_id) || null,
        };
        const existing = grouped.get(report.match_identifier) || [];
        existing.push(enriched);
        grouped.set(report.match_identifier, existing);
      }

      // Transform into GroupedMatchReport[]
      const result: GroupedMatchReport[] = [];
      for (const [identifier, reports] of grouped) {
        const [teams, date] = identifier.split("|");
        const [homeTeam, awayTeam] = teams.split(" vs ");
        const ratingsWithValues = reports.filter((r) => r.rating !== null);

        result.push({
          match_identifier: identifier,
          homeTeam: homeTeam?.trim() || "Unknown",
          awayTeam: awayTeam?.trim() || "Unknown",
          matchDate: date || "",
          reports,
          totalRatings: ratingsWithValues.length,
          averageRating:
            ratingsWithValues.length > 0
              ? ratingsWithValues.reduce((sum, r) => sum + (r.rating || 0), 0) /
                ratingsWithValues.length
              : null,
        });
      }

      // Sort by most recent report date
      result.sort((a, b) => {
        const aLatest = Math.max(...a.reports.map((r) => new Date(r.updated_at).getTime()));
        const bLatest = Math.max(...b.reports.map((r) => new Date(r.updated_at).getTime()));
        return bLatest - aLatest;
      });

      return result;
    },
    enabled: !!user,
  });
};
